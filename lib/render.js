const { img, slugify } = require('./tmdb');

const SITE_NAME = '씨네박스';
const DEFAULT_TITLE = '씨네박스 · 한국 영화·시리즈 정보 데이터베이스 | 줄거리·출연진·예고편';
const DEFAULT_DESC = '씨네박스에서 인기 영화와 시리즈의 줄거리, 출연진, 평점, 공식 예고편을 한국어로 확인하세요. 시즌별 에피소드 정보까지 한눈에 볼 수 있는 영화·드라마 정보 사이트입니다.';

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function head({ title, description, url, image, type = 'website' }) {
  const t = escapeHtml(title || DEFAULT_TITLE);
  const d = escapeHtml((description || DEFAULT_DESC).slice(0, 160));
  const ogImg = image || 'https://image.tmdb.org/t/p/w500/placeholder.png';
  return `
    <title>${t}</title>
    <meta name="description" content="${d}">
    <meta name="robots" content="index, follow">
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
  return `
    <a class="poster-card" href="/${type}/${item.id}/${slug}">
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

module.exports = { head, layout, posterCard, genreRow, trailerBlock, castGrid, escapeHtml, DEFAULT_TITLE, DEFAULT_DESC, SITE_NAME };
