const { img, slugify } = require('./tmdb');

const SITE_NAME = '씨네박스';
const DEFAULT_TITLE = '최신 한국영화·드라마 무료 스트리밍 | 씨네박스';
const DEFAULT_DESC = '최신 한국영화, 해외영화, 드라마를 FHD 고화질 한글자막으로 무료 스트리밍하세요. 씨네박스에서 가장 빠르게 최신 콘텐츠를 만나보세요.';
const DEFAULT_OG_IMAGE = 'https://placehold.co/1200x630/17171b/8d8a92?text=씨네박스';
const GOOGLE_SITE_VERIFICATION = 'M-_SCpf4h0A8JcaYgk3_kEfeagIFV6cKmqsg0iROtiI';

// ---------- Adsterra & Histats ----------
function bannerScript(key, width, height) {
  return `<script>atOptions = { 'key' : '${key}', 'format' : 'iframe', 'height' : ${height}, 'width' : ${width}, 'params' : {} };</script><script src="https://www.highperformanceformat.com/${key}/invoke.js"></script>`;
}

function topBannerAd() {
  return `
    <div class="ad-slot ad-desktop-only">${bannerScript('9eab15e2d0d97de74e3ee971fe615a5e', 728, 90)}</div>
    <div class="ad-slot ad-mobile-only">${bannerScript('374f3cbadfdea331b749dcfc79f79f2c', 320, 50)}</div>
  `;
}

function sideBannerAd() {
  return `<div class="ad-slot ad-desktop-only">${bannerScript('25247fde261d8f76e06b91b9d74945f4', 160, 600)}</div>`;
}

function nativeBannerAd() {
  return `
    <div class="ad-slot ad-native">
      <script async data-cfasync="false" src="https://pl30557737.effectivecpmnetwork.com/6f7b03feb080b4884047d6210ed8268e/invoke.js"></script>
      <div id="container-6f7b03feb080b4884047d6210ed8268e"></div>
    </div>
  `;
}

function socialBarScript() {
  return `<script src="https://pl30557736.effectivecpmnetwork.com/af/c1/6d/afc16d8a70f1f493abf2098939fca8f7.js"></script>`;
}

function histatsSnippet() {
  return `
    <div id="histats_counter" style="display:none;"></div>
    <script type="text/javascript">
    var _Hasync = _Hasync || [];
    _Hasync.push(['Histats.start', '1,5014113,4,1,120,40,00011111']);
    _Hasync.push(['Histats.fasi', '1']);
    _Hasync.push(['Histats.track_hits', '']);
    (function() {
      var hs = document.createElement('script'); hs.type = 'text/javascript'; hs.async = true;
      hs.src = ('//s10.histats.com/js15_as.js');
      (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(hs);
    })();
    </script>
    <noscript><a href="/" target="_blank"><img src="//sstatic1.histats.com/0.gif?5014113&101" alt="" border="0" style="display:none;"></a></noscript>
  `;
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function head({ title, description, url, image, type = 'website', robots = 'index, follow' }) {
  const t = escapeHtml(title || DEFAULT_TITLE);
  const d = escapeHtml((description || DEFAULT_DESC).slice(0, 160));
  const ogImg = image || DEFAULT_OG_IMAGE;
  return `
    <title>${t}</title>
    <meta name="google-site-verification" content="${GOOGLE_SITE_VERIFICATION}" />
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

function personJsonLd(person, url) {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    description: (person.biography || '').slice(0, 300),
    url,
    image: img(person.profile_path, 'w780'),
    birthDate: person.birthday || undefined,
    deathDate: person.deathday || undefined,
  };
  return `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}

// ---------- Player & Person Helpers ----------
function mockPlayerBlock(backdropOrPoster, title) {
  return `
    <div class="player-block" id="stream-player">
      <div class="player-container">
        <div class="player-poster" style="background-image:url('${img(backdropOrPoster, 'original')}')"></div>
        <div class="player-overlay">
          <div class="play-btn-circle">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <div class="player-text">FHD 고화질 스트리밍 플레이어</div>
        </div>
      </div>
    </div>
  `;
}

function personBlock(person, credits) {
  const castCredits = ((credits && credits.cast) || []).slice(0, 12);
  const knownForCards = castCredits.map(item => posterCard(item, item.media_type || 'movie')).join('');
  return `
    <a class="back-btn" href="/movie">← 돌아가기</a>
    <div class="person-detail">
      <div class="person-profile">
        <img src="${img(person.profile_path, 'w300')}" alt="${escapeHtml(person.name)}">
      </div>
      <div class="person-info">
        <h1 class="person-name">${escapeHtml(person.name)}</h1>
        <div class="person-meta">
          ${person.birthday ? `<span>생년월일: ${person.birthday}</span>` : ''}
          ${person.place_of_birth ? `<span>출생지: ${escapeHtml(person.place_of_birth)}</span>` : ''}
          ${person.known_for_department ? `<span>분야: ${escapeHtml(person.known_for_department)}</span>` : ''}
        </div>
        <div class="section-block">
          <h3>인물 정보</h3>
          <div class="bio-text">${escapeHtml(person.biography) || '등록된 인물 정보가 없습니다.'}</div>
        </div>
      </div>
    </div>
    ${knownForCards ? `
    <div class="section-block">
      <h3>주요 출연작</h3>
      <div class="grid">${knownForCards}</div>
    </div>
    ` : ''}
  `;
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
<style>
  .ad-slot { display: flex; justify-content: center; align-items: center; margin: 20px auto; overflow: hidden; min-height: 0; }
  .ad-mobile-only { display: none; }
  @media (max-width: 768px) {
    .ad-desktop-only { display: none; }
    .ad-mobile-only { display: flex; }
  }
</style>
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
${topBannerAd()}
<main>
${bodyHtml}
</main>
<footer>
  <p>씨네박스 — TMDB 공개 데이터를 사용한 영화·시리즈 정보 사이트 (스트리밍 서비스 아님) · Powered by <a href="https://www.themoviedb.org/" target="_blank" rel="noopener">TMDB</a></p>
  ${histatsSnippet()}
</footer>
<script src="/app.js"></script>
${socialBarScript()}
</body>
</html>`;
}

function posterCard(item, type) {
  const title = item.title || item.name;
  const date = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '-';
  const slug = slugify(title);
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
    <a class="cast-card" href="/person/${c.id}/${encodeURIComponent(slugify(c.name))}">
      <img src="${img(c.profile_path, 'w185')}" alt="${escapeHtml(c.name)}" loading="lazy">
      <div class="cast-name">${escapeHtml(c.name)}</div>
      <div class="cast-role">${escapeHtml(c.character || '')}</div>
    </a>
  `).join('')}</div>`;
}

module.exports = {
  head,
  layout,
  posterCard,
  genreRow,
  trailerBlock,
  castGrid,
  mockPlayerBlock,
  personBlock,
  escapeHtml,
  movieJsonLd,
  tvJsonLd,
  personJsonLd,
  sideBannerAd,
  nativeBannerAd,
  DEFAULT_TITLE,
  DEFAULT_DESC,
  SITE_NAME
};
