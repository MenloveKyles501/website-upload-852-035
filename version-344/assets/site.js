
import { H as Hls } from './hls.js';

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;

  const menuToggle = document.querySelector('[data-menu-toggle]');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => body.classList.toggle('nav-open'));
  }

  // Hero slider
  const slides = Array.from(document.querySelectorAll('[data-slide]'));
  if (slides.length) {
    const dotsHost = document.querySelector('[data-hero-dots]');
    const prevBtn = document.querySelector('[data-hero-prev]');
    const nextBtn = document.querySelector('[data-hero-next]');
    let index = 0;

    const activate = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((slide, j) => slide.classList.toggle('active', j === index));
      if (dotsHost) {
        dotsHost.querySelectorAll('button').forEach((btn, j) => btn.classList.toggle('active', j === index));
      }
    };

    if (dotsHost) {
      dotsHost.innerHTML = slides.map((_, i) => `<button type="button" aria-label="切换到第 ${i + 1} 张"></button>`).join('');
      dotsHost.querySelectorAll('button').forEach((btn, i) => btn.addEventListener('click', () => activate(i)));
    }

    prevBtn?.addEventListener('click', () => activate(index - 1));
    nextBtn?.addEventListener('click', () => activate(index + 1));
    activate(0);
    setInterval(() => activate(index + 1), 5000);
  }

  // Search page
  const results = document.querySelector('[data-search-results]');
  const counter = document.querySelector('[data-search-count]');
  const form = document.querySelector('[data-search-form]');
  const queryInput = document.querySelector('[data-search-input]');
  const categorySelect = document.querySelector('[data-category-filter]');
  const typeSelect = document.querySelector('[data-type-filter]');
  const yearSelect = document.querySelector('[data-year-filter]');

  const appMovies = Array.isArray(window.MOVIES) ? window.MOVIES : [];

  if (results && appMovies.length) {
    const params = new URLSearchParams(location.search);
    const initQuery = (params.get('q') || '').trim();
    if (queryInput && initQuery) queryInput.value = initQuery;

    const render = () => {
      const q = (queryInput?.value || '').trim().toLowerCase();
      const cat = categorySelect?.value || '';
      const type = typeSelect?.value || '';
      const year = yearSelect?.value || '';

      const filtered = appMovies.filter((m) => {
        const hay = [m.title, m.region, m.type, m.genre, m.tags, m.oneLine, m.summary, m.review, m.categoryName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (q && !hay.includes(q)) return false;
        if (cat && m.categorySlug !== cat) return false;
        if (type && !(m.type || '').includes(type)) return false;
        if (year && String(m.year) !== year) return false;
        return true;
      });

      if (counter) counter.textContent = `${filtered.length} 部影片`;
      results.innerHTML = filtered.slice(0, 240).map((m, idx) => {
        const c1 = m.c1 || '#2563eb';
        const c2 = m.c2 || '#7c3aed';
        return `
          <a class="movie-card compact" href="${m.path}" style="--c1:${c1};--c2:${c2};">
            <div class="movie-poster">
              <div class="poster-top">
                <span class="chip">${escapeHtml(m.categoryName || '')}</span>
                <span class="chip chip-soft">${escapeHtml(`${m.year || ''} · ${m.region || ''}`)}</span>
              </div>
              <div class="poster-center">
                <span class="poster-kicker">${escapeHtml(m.genre || '')}</span>
                <h3>${escapeHtml(m.title || '')}</h3>
              </div>
              <div class="poster-bottom">
                <span>${escapeHtml(m.type || '')}</span>
                <span>#${String(m.id).padStart(4, '0')}</span>
              </div>
            </div>
            <div class="movie-body">
              <div class="movie-title-row">
                <h4>${escapeHtml(m.title || '')}</h4>
                <span class="score-badge">${idx + 1}</span>
              </div>
              <p>${escapeHtml((m.oneLine || m.summary || '').slice(0, 120))}${(m.oneLine || m.summary || '').length > 120 ? '…' : ''}</p>
              <div class="movie-meta">${escapeHtml([m.year, m.region, m.type].filter(Boolean).join(' · '))}</div>
            </div>
          </a>
        `;
      }).join('');

      if (!filtered.length) {
        results.innerHTML = `<div class="search-empty">没有找到匹配结果，试试其他关键词或分类。</div>`;
      }
    };

    const setFromUrl = () => {
      const params = new URLSearchParams(location.search);
      const q = params.get('q') || '';
      if (queryInput && !queryInput.value) queryInput.value = q;
      render();
    };

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const params = new URLSearchParams(location.search);
      if (queryInput?.value.trim()) params.set('q', queryInput.value.trim());
      else params.delete('q');
      history.replaceState(null, '', `${location.pathname}?${params.toString()}`.replace(/\?$/, ''));
      render();
    });

    [queryInput, categorySelect, typeSelect, yearSelect].forEach((el) => {
      el?.addEventListener('input', () => {
        const params = new URLSearchParams(location.search);
        if (queryInput?.value.trim()) params.set('q', queryInput.value.trim()); else params.delete('q');
        history.replaceState(null, '', `${location.pathname}?${params.toString()}`.replace(/\?$/, ''));
        render();
      });
    });

    const escapeHtml = (s) => String(s || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

    setFromUrl();
  }

  // HLS video player
  const video = document.querySelector('video[data-hls-src]');
  if (video) {
    const src = video.getAttribute('data-hls-src');
    const status = document.querySelector('[data-player-status]');

    const mark = (text) => {
      if (status) status.textContent = text;
    };

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      mark('已启用原生 HLS 播放');
    } else if (Hls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => mark('HLS 播放器已就绪'));
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data?.fatal) mark('播放中出现网络或源错误，请刷新重试');
      });
    } else {
      video.src = src;
      mark('浏览器将以兼容模式播放');
    }
  }
});
