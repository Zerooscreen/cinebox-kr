const { img, slugify } = require('./tmdb');

const SITE_NAME = '씨네박스';
const DEFAULT_TITLE = '씨네박스 · 최신 인기 영화·시리즈 줄거리·평점·출연진·예고편 총정리';
const DEFAULT_DESC = '씨네박스에서 최신 인기 영화와 시리즈의 줄거리, 출연진, 평점, 공식 예고편을 한국어로 확인하세요. 시즌별 에피소드 정보까지 한눈에 볼 수 있는 영화·드라마 정보 사이트입니다.';
// Fallback OG image: rasio 1200x630 (rekomendasi Open Graph), bukan path TMDB yang tidak ada.
const DEFAULT_OG_IMAGE = 'https://placehold.co/1200x630/17171b/8d8a92?text=씨네박스';

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// robots: default "index, follow". Kirim 'noindex, nofollow' untuk halaman error/404
// agar Google tidak meng-index halaman kosong/tidak ditemukan.
function head({ title, description, url, image, type = 'website', robots = 'index, follow' }) {
  const t = escapeHtml(title || DEFAULT_TITLE);
  const d = escapeHtml((description || DEFAULT_DESC).slice(0, 160));
  const ogImg = image || DEFAULT_OG_IMAGE;
  return `
    <title>${t}</title>
    <meta name="description" content="${d}">
    <meta name="robots" content="${robots}">
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="${type}">
    <meta property="og:site_name" content="${SITE_NAME}">
    <meta property="og:title" content="${t}">
    <meta property="og:description" content="${d}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${ogImg}">
    <meta property="og:locale" content="ko_KR">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${t}">
    <meta name="twitter:description" content="${d}">
    <meta name="twitter:image" content="${ogImg}">
  `;
}

// ---------- Structured Data (Schema.org) ----------
// Membuat Google bisa menampilkan rich snippet (poster, rating, tahun) di hasil pencarian.
function movieJsonLd(data, url) {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: data.title,
    description: (data.overview || '').slice(0, 300),
    url,
    image: img(data.poster_path || data.backdrop_path, 'w780'),
    datePublished: data.release_date || undefined,
    genre: (data.genres || []).map(g => g.name),
  };
  if (data.vote_average && data.vote_count) {
    payload.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.vote_average.toFixed(1),
      ratingCount: data.vote_count,
      bestRating: '10',
      worstRating: '0',
    };
  }
  return `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}

function tvJsonLd(data, url) {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: data.name,
    description: (data.overview || '').slice(0, 300),
    url,
    image: img(data.poster_path || data.backdrop_path, 'w780'),
    datePublished: data.first_air_date || undefined,
    genre: (data.genres || []).map(g => g.name),
    numberOfSeasons: data.number_of_seasons || undefined,
    numberOfEpisodes: data.number_of_episodes || undefined,
  };
  if (data.vote_average && data.vote_count) {
    payload.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.vote_average.toFixed(1),
      ratingCount: data.vote_count,
      bestRating: '10',
      worstRating: '0',
    };
  }
  return `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}

function layout({ headHtml, bodyHtml, activeTab = 'movie' }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${headHtml}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header>
  <div class="header-inner">
    <a class="logo" href="/movie">씨네<span>박스</span></a>
    <nav class="tabs">
      <a class="tab-btn ${activeTab === 'movie' ? 'active' : ''}" href="/movie">영화</a>
      <a class="tab-btn ${activeTab === 'tv' ? 'active' : ''}" href="/tv">시리즈</a>
    </nav>
    <div class="search-wrap">
      <input id="search-input" type="text" placeholder="제목 검색..." autocomplete="off">
      <div class="search-results" id="search-results"></div>
    </div>
  </div>
</header>
<main>
${bodyHtml}
</main>
<footer>
  <p>씨네박스 — TMDB 공개 데이터를 사용한 영화·시리즈 정보 사이트 (스트리밍 서비스 아님) · Powered by <a href="https://www.themoviedb.org/" target="_blank" rel="noopener">TMDB</a></p>
</footer>
<script src="/app.js"></script>
</body>
</html>`;
}

function posterCard(item, type) {
  const title = item.title || item.name;
  const date = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '-';
  const slug = slugify(title);
  // encodeURIComponent WAJIB di sini juga (konsisten dengan route detail),
  // supaya href tidak berisi teks Korea mentah yang belum di-encode.
  return `
    <a class="poster-card" href="/${type}/${item.id}/${encodeURIComponent(slug)}">
      <div class="poster-frame">
        <img src="${img(item.poster_path)}" alt="${escapeHtml(title)}" loading="lazy">
        <div class="poster-badge">★ ${rating}</div>
      </div>
      <div class="poster-title">${escapeHtml(title)}</div>
      <div class="poster-sub">${date || '연도 미상'}</div>
    </a>
  `;
}

function genreRow(genres) {
  if (!genres || !genres.length) return '';
  return `<div class="genre-row">${genres.map(g => `<span class="genre-pill">${escapeHtml(g.name)}</span>`).join('')}</div>`;
}

function trailerBlock(videos) {
  const list = (videos && videos.results) || [];
  const trailer = list.find(v => v.site === 'YouTube' && v.type === 'Trailer') || list.find(v => v.site === 'YouTube');
  if (!trailer) return `<div class="no-trailer">등록된 예고편이 없습니다.</div>`;
  return `
    <div class="trailer-wrap">
      <iframe src="https://www.youtube.com/embed/${trailer.key}" title="trailer" allowfullscreen loading="lazy"></iframe>
    </div>
  `;
}

function castGrid(credits) {
  const cast = ((credits && credits.cast) || []).slice(0, 12);
  if (!cast.length) return `<div class="empty">출연 정보가 없습니다.</div>`;
  return `<div class="cast-grid">${cast.map(c => `
    <div class="cast-card">
      <img src="${img(c.profile_path, 'w185')}" alt="${escapeHtml(c.name)}" loading="lazy">
      <div class="cast-name">${escapeHtml(c.name)}</div>
      <div class="cast-role">${escapeHtml(c.character || '')}</div>
    </div>
  `).join('')}</div>`;
}

module.exports = { head, layout, posterCard, genreRow, trailerBlock, castGrid, escapeHtml, movieJsonLd, tvJsonLd, DEFAULT_TITLE, DEFAULT_DESC, SITE_NAME };
