const express = require('express');
const path = require('path');
const { tmdb, img, slugify } = require('./lib/tmdb');
const { head, layout, posterCard, genreRow, trailerBlock, castGrid, escapeHtml, movieJsonLd, tvJsonLd, sideBannerAd, nativeBannerAd, DEFAULT_TITLE, DEFAULT_DESC, SITE_NAME } = require('./lib/render');

const app = express();
const PORT = process.env.PORT || 3000;

// Domain resmi situs — dipakai untuk sitemap, canonical, dan Open Graph URL
const SITE_URL = process.env.SITE_URL || 'https://cinebox.up.railway.app';

// ---------- Pola judul & deskripsi SEO (dipakai di SEMUA halaman detail) ----------
// Format ini konsisten untuk setiap film/series apa pun (Spider-Man, Supergirl, dst),
// memakai keyword bervolume tinggi TAPI tetap jujur sesuai isi halaman (sinopsis/info),
// bukan klaim "streaming gratis" yang tidak sesuai konten -> aman dari Google spam policy.
function seoTitle(kind, title, year) {
  const label = kind === 'movie' ? '영화' : '시리즈';
  const y = year || '개봉연도 미상';
  return `[${label}] ${title} (${y}) 줄거리·평점·출연진·예고편 총정리`;
}

function seoDescription(title, year, genreNames) {
  const yearPart = year ? `${year}년 작품, ` : '';
  const genrePart = genreNames ? `${genreNames} 장르, ` : '';
  return `${title}의 줄거리와 출연진, 평점, 공식 예고편을 씨네박스에서 한눈에 확인하세요. ${genrePart}${yearPart}개봉 정보까지 빠르게 정리했습니다.`;
}

app.use(express.static(path.join(__dirname, 'public')));

const ROWS = {
  movie: [
    { key: '01', title: '지금 뜨는 영화', path: '/trending/movie/week' },
    { key: '02', title: '인기 영화', path: '/movie/popular' },
    { key: '03', title: '최고 평점 영화', path: '/movie/top_rated' },
    { key: '04', title: '개봉 예정작', path: '/movie/upcoming' },
  ],
  tv: [
    { key: '01', title: '지금 뜨는 시리즈', path: '/trending/tv/week' },
    { key: '02', title: '인기 시리즈', path: '/tv/popular' },
    { key: '03', title: '최고 평점 시리즈', path: '/tv/top_rated' },
    { key: '04', title: '방영 중인 시리즈', path: '/tv/on_the_air' },
  ],
};

// ---------- HOME (/, /movie, /tv) ----------
async function renderHome(req, res, tab) {
  try {
    const heroData = await tmdb(tab === 'movie' ? '/trending/movie/week' : '/trending/tv/week');
    const hero = heroData.results[0];
    const heroTitle = hero ? (hero.title || hero.name) : SITE_NAME;
    const heroOverview = hero ? (hero.overview || '') : '';

    const rowsHtml = [];
    for (const def of ROWS[tab]) {
      const data = await tmdb(def.path);
      const cards = data.results.slice(0, 12).map(item => posterCard(item, tab)).join('');
      rowsHtml.push(`
        <section class="row">
          <div class="row-head"><span class="row-num">${def.key}</span><h2>${def.title}</h2></div>
          <div class="grid">${cards}</div>
        </section>
      `);
    }

    // PENTING: slugify() mengembalikan teks mentah (belum di-encode).
    // Saat dipakai di dalam href, wajib dibungkus encodeURIComponent agar
    // karakter non-ASCII (mis. huruf Korea) aman di URL, sekaligus tetap
    // konsisten dengan req.params.slug yang di-decode otomatis oleh Express.
    const heroHtml = hero ? `
      <div id="hero">
        <div class="hero-bg" style="background-image:url('${img(hero.backdrop_path, 'original')}')"></div>
        <div class="hero-fade"></div>
        <div class="hero-content">
          <div class="hero-eyebrow">이번 주 화제작</div>
          <div class="hero-title">${escapeHtml(heroTitle)}</div>
          <div class="hero-overview">${escapeHtml(heroOverview).slice(0, 180)}${heroOverview.length > 180 ? '…' : ''}</div>
          <a class="hero-btn" href="/${tab}/${hero.id}/${encodeURIComponent(slugify(heroTitle))}">자세히 보기 ▸</a>
        </div>
      </div>` : '';

    const bodyHtml = heroHtml + `<div id="rows">${rowsHtml.join('')}</div>`;

    const headHtml = head({
      title: DEFAULT_TITLE,
      description: DEFAULT_DESC,
      url: `${SITE_URL}/${tab}`,
      image: hero ? img(hero.backdrop_path, 'w780') : null,
    });

    res.send(layout({ headHtml, bodyHtml, activeTab: tab }));
  } catch (e) {
    res.status(500).send(layout({
      headHtml: head({ title: DEFAULT_TITLE, description: DEFAULT_DESC, url: `${SITE_URL}/${tab}` }),
      bodyHtml: `<div class="empty">데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>`,
      activeTab: tab,
    }));
  }
}

app.get('/', (req, res) => renderHome(req, res, 'movie'));
app.get('/movie', (req, res) => renderHome(req, res, 'movie'));
app.get('/tv', (req, res) => renderHome(req, res, 'tv'));

// ---------- DETAIL: /movie/:id/:slug? ----------
app.get('/movie/:id/:slug?', async (req, res) => {
  const { id } = req.params;
  try {
    const [data, credits, videos] = await Promise.all([
      tmdb(`/movie/${id}`),
      tmdb(`/movie/${id}/credits`),
      tmdb(`/movie/${id}/videos`),
    ]);
    // correctSlug = teks mentah (decoded), sama seperti req.params.slug -> perbandingan valid
    const correctSlug = slugify(data.title);
    if (req.params.slug !== correctSlug) {
      // encodeURIComponent HANYA dipakai di sini, saat membangun URL redirect
      return res.redirect(301, `/movie/${id}/${encodeURIComponent(correctSlug)}`);
    }

    const runtime = data.runtime ? `${Math.floor(data.runtime / 60)}시간 ${data.runtime % 60}분` : '정보 없음';
    const bodyHtml = `
      <a class="back-btn" href="/movie">← 돌아가기</a>
      <div class="detail-hero">
        <div class="hero-bg" style="background-image:url('${img(data.backdrop_path, 'original')}')"></div>
        <div class="hero-fade"></div>
        <div class="detail-poster"><img src="${img(data.poster_path)}" alt="${escapeHtml(data.title)} 포스터"></div>
        <div class="detail-info">
          <div class="detail-eyebrow">영화</div>
          <h1 class="detail-title">${escapeHtml(data.title)}</h1>
          <div class="detail-orig">${escapeHtml(data.original_title)} · ${(data.release_date || '').slice(0, 4) || '연도 미상'}</div>
          ${data.tagline ? `<div class="tagline">"${escapeHtml(data.tagline)}"</div>` : ''}
          <div class="detail-meta">
            <span class="m-item star">★ ${data.vote_average ? data.vote_average.toFixed(1) : '-'} / 10</span>
            <span class="m-item">${runtime}</span>
            <span class="m-item">${escapeHtml(data.status || '')}</span>
          </div>
          ${genreRow(data.genres)}
        </div>
      </div>
      <div class="section-block"><h3>줄거리</h3><div class="bio-text">${escapeHtml(data.overview) || '등록된 줄거리가 없습니다.'}</div></div>
      ${nativeBannerAd()}
      <div class="section-block"><h3>예고편</h3>${trailerBlock(videos)}</div>
      <div class="section-block"><h3>출연진</h3>${castGrid(credits)}</div>
      ${sideBannerAd()}
      ${movieJsonLd(data, `${SITE_URL}/movie/${id}/${encodeURIComponent(correctSlug)}`)}
    `;

    const headHtml = head({
      title: seoTitle('movie', data.title, (data.release_date || '').slice(0, 4)),
      description: seoDescription(data.title, (data.release_date || '').slice(0, 4), (data.genres || []).map(g => g.name).join(', ')),
      url: `${SITE_URL}/movie/${id}/${encodeURIComponent(correctSlug)}`,
      image: img(data.backdrop_path || data.poster_path, 'w780'),
      type: 'video.movie',
    });

    res.send(layout({ headHtml, bodyHtml, activeTab: 'movie' }));
  } catch (e) {
    res.status(404).send(layout({
      headHtml: head({
        title: '영화를 찾을 수 없습니다 · 씨네박스',
        description: DEFAULT_DESC,
        url: `${SITE_URL}/movie/${id}`,
        robots: 'noindex, nofollow',
      }),
      bodyHtml: `<a class="back-btn" href="/movie">← 돌아가기</a><div class="empty">영화 정보를 찾을 수 없습니다.</div>`,
      activeTab: 'movie',
    }));
  }
});

// ---------- DETAIL: /tv/:id/:slug? ----------
app.get('/tv/:id/:slug?', async (req, res) => {
  const { id } = req.params;
  try {
    const [data, credits, videos] = await Promise.all([
      tmdb(`/tv/${id}`),
      tmdb(`/tv/${id}/credits`),
      tmdb(`/tv/${id}/videos`),
    ]);
    const correctSlug = slugify(data.name);
    if (req.params.slug !== correctSlug) {
      return res.redirect(301, `/tv/${id}/${encodeURIComponent(correctSlug)}`);
    }

    const seasons = (data.seasons || []).filter(s => s.season_number >= 0);
    const seasonsHtml = seasons.map(s => `
      <div class="season-item" data-season="${s.season_number}" data-tv="${id}">
        <div class="season-head">
          <img src="${img(s.poster_path, 'w92')}" alt="${escapeHtml(s.name)}">
          <div>
            <div class="s-title">${escapeHtml(s.name)}</div>
            <div class="s-meta">에피소드 ${s.episode_count}개 · ${(s.air_date || '').slice(0, 4) || '방영일 미상'}</div>
          </div>
          <div class="chev">▶</div>
        </div>
        <div class="episode-panel"></div>
      </div>
    `).join('');

    const bodyHtml = `
      <a class="back-btn" href="/tv">← 돌아가기</a>
      <div class="detail-hero">
        <div class="hero-bg" style="background-image:url('${img(data.backdrop_path, 'original')}')"></div>
        <div class="hero-fade"></div>
        <div class="detail-poster"><img src="${img(data.poster_path)}" alt="${escapeHtml(data.name)} 포스터"></div>
        <div class="detail-info">
          <div class="detail-eyebrow">시리즈</div>
          <h1 class="detail-title">${escapeHtml(data.name)}</h1>
          <div class="detail-orig">${escapeHtml(data.original_name)} · ${(data.first_air_date || '').slice(0, 4) || '연도 미상'}</div>
          ${data.tagline ? `<div class="tagline">"${escapeHtml(data.tagline)}"</div>` : ''}
          <div class="detail-meta">
            <span class="m-item star">★ ${data.vote_average ? data.vote_average.toFixed(1) : '-'} / 10</span>
            <span class="m-item">시즌 ${data.number_of_seasons || '-'}개</span>
            <span class="m-item">에피소드 ${data.number_of_episodes || '-'}개</span>
            <span class="m-item">${escapeHtml(data.status || '')}</span>
          </div>
          ${genreRow(data.genres)}
        </div>
      </div>
      <div class="section-block"><h3>줄거리</h3><div class="bio-text">${escapeHtml(data.overview) || '등록된 줄거리가 없습니다.'}</div></div>
      ${nativeBannerAd()}
      <div class="section-block"><h3>예고편</h3>${trailerBlock(videos)}</div>
      <div class="section-block"><h3>출연진</h3>${castGrid(credits)}</div>
      <div class="section-block">
        <h3>시즌 &amp; 에피소드</h3>
        <div class="season-list" id="season-list">${seasonsHtml}</div>
      </div>
      ${sideBannerAd()}
      ${tvJsonLd(data, `${SITE_URL}/tv/${id}/${encodeURIComponent(correctSlug)}`)}
    `;

    const headHtml = head({
      title: seoTitle('tv', data.name, (data.first_air_date || '').slice(0, 4)),
      description: seoDescription(data.name, (data.first_air_date || '').slice(0, 4), (data.genres || []).map(g => g.name).join(', ')),
      url: `${SITE_URL}/tv/${id}/${encodeURIComponent(correctSlug)}`,
      image: img(data.backdrop_path || data.poster_path, 'w780'),
      type: 'video.tv_show',
    });

    res.send(layout({ headHtml, bodyHtml, activeTab: 'tv' }));
  } catch (e) {
    res.status(404).send(layout({
      headHtml: head({
        title: '시리즈를 찾을 수 없습니다 · 씨네박스',
        description: DEFAULT_DESC,
        url: `${SITE_URL}/tv/${id}`,
        robots: 'noindex, nofollow',
      }),
      bodyHtml: `<a class="back-btn" href="/tv">← 돌아가기</a><div class="empty">시리즈 정보를 찾을 수 없습니다.</div>`,
      activeTab: 'tv',
    }));
  }
});

// ---------- API proxy (dipakai oleh public/app.js di sisi client) ----------
app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json({ results: [] });
    const data = await tmdb('/search/multi', { query: q });
    const results = data.results
      .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
      .slice(0, 8)
      .map(r => ({
        id: r.id,
        type: r.media_type,
        title: r.title || r.name,
        year: (r.release_date || r.first_air_date || '').slice(0, 4),
        poster: img(r.poster_path, 'w92'),
        slug: slugify(r.title || r.name),
      }));
    res.json({ results });
  } catch (e) {
    res.status(500).json({ results: [], error: true });
  }
});

app.get('/api/season/:tvId/:seasonNumber', async (req, res) => {
  try {
    const { tvId, seasonNumber } = req.params;
    const data = await tmdb(`/tv/${tvId}/season/${seasonNumber}`);
    const episodes = (data.episodes || []).map(ep => ({
      number: ep.episode_number,
      name: ep.name,
      airDate: ep.air_date,
      rating: ep.vote_average ? ep.vote_average.toFixed(1) : '-',
      overview: ep.overview,
      still: img(ep.still_path, 'w300'),
    }));
    res.json({ episodes });
  } catch (e) {
    res.status(500).json({ episodes: [], error: true });
  }
});

// ---------- sitemap.xml (dinamis, dari daftar populer TMDB) ----------
app.get('/sitemap.xml', async (req, res) => {
  try {
    const [mp, mt, tp, tt] = await Promise.all([
      tmdb('/movie/popular'),
      tmdb('/movie/top_rated'),
      tmdb('/tv/popular'),
      tmdb('/tv/top_rated'),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const urls = [
      { loc: `${SITE_URL}/movie`, priority: '1.0', changefreq: 'daily' },
      { loc: `${SITE_URL}/tv`, priority: '1.0', changefreq: 'daily' },
      ...[...mp.results, ...mt.results].map(m => ({ loc: `${SITE_URL}/movie/${m.id}/${encodeURIComponent(slugify(m.title))}`, priority: '0.7', changefreq: 'weekly' })),
      ...[...tp.results, ...tt.results].map(t => ({ loc: `${SITE_URL}/tv/${t.id}/${encodeURIComponent(slugify(t.name))}`, priority: '0.7', changefreq: 'weekly' })),
    ];
    const uniq = [...new Map(urls.map(u => [u.loc, u])).values()];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniq.map(u => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;
    res.type('application/xml').send(xml);
  } catch (e) {
    res.status(500).send('');
  }
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
});

app.listen(PORT, () => {
  console.log(`씨네박스 서버 실행 중: http://localhost:${PORT}`);
});
