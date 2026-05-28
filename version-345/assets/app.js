
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const body = document.body;

  // Mobile menu
  const menuBtn = $('[data-menu-toggle]');
  const mobileMenu = $('[data-mobile-menu]');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('is-open');
    });
  }

  // Back to top
  const toTop = $('[data-to-top]');
  const toggleToTop = () => {
    if (!toTop) return;
    if (window.scrollY > 420) toTop.classList.add('is-visible');
    else toTop.classList.remove('is-visible');
  };
  window.addEventListener('scroll', toggleToTop, { passive: true });
  toggleToTop();
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Hero carousel
  const carousel = $('[data-carousel]');
  if (carousel) {
    const slides = $$('.carousel-slide', carousel);
    const dots = $$('.carousel-dot', carousel);
    const prevBtn = $('[data-carousel-prev]', carousel);
    const nextBtn = $('[data-carousel-next]', carousel);
    let index = 0;
    let timer = null;

    const go = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    };

    const start = () => {
      stop();
      timer = setInterval(() => go(index + 1), 5200);
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    dots.forEach((dot, i) => dot.addEventListener('click', () => { go(i); start(); }));
    if (prevBtn) prevBtn.addEventListener('click', () => { go(index - 1); start(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { go(index + 1); start(); });
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    go(0);
    start();
  }

  // Tabs / filter buttons (simple active state handling)
  $$('[data-tab-group]').forEach(group => {
    const tabs = $$('.tab-button', group);
    const panels = $$('.tab-panel', group);
    tabs.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        if (panels[i]) panels[i].classList.add('active');
      });
    });
  });

  // Search page
  const searchInput = $('[data-search-input]');
  const searchResults = $('[data-search-results]');
  const searchCount = $('[data-search-count]');
  if (searchInput && searchResults && Array.isArray(window.SITE_MOVIES)) {
    const prefix = searchResults.dataset.prefix || '';
    const initialQuery = new URLSearchParams(window.location.search).get('q');
    if (initialQuery) searchInput.value = initialQuery;
    const renderCard = (m) => {
      const href = `${prefix}${m.url}`;
      const img = `${prefix}${m.poster}`;
      const tags = (m.tags || []).slice(0, 3).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
      return `
      <article class="movie-card">
        <a class="movie-link" href="${href}">
          <div class="movie-poster">
            <img src="${img}" alt="${escapeHtml(m.title)}" loading="lazy">
            <div class="poster-overlay"></div>
            <div class="poster-badge">${escapeHtml(m.typeLabel || '影片')}</div>
            <div class="poster-score">热度 ${Number(m.hot || 0).toFixed(1)}</div>
          </div>
          <div class="movie-body">
            <h3 class="movie-title">${escapeHtml(m.title)}</h3>
            <p class="movie-meta">${escapeHtml(m.year || '')} · ${escapeHtml(m.region || '')} · ${escapeHtml(m.genre || m.typeLabel || '')}</p>
            <p class="movie-excerpt">${escapeHtml(trunc(m.oneLine || '', 68))}</p>
            <div class="movie-tags">${tags}</div>
          </div>
        </a>
      </article>`;
    };

    const refresh = () => {
      const q = searchInput.value.trim().toLowerCase();
      const list = window.SITE_MOVIES.filter(m => {
        if (!q) return true;
        const hay = [
          m.title, m.region, m.type, m.typeLabel, m.genre,
          (m.tags || []).join(' '), m.oneLine, m.summary
        ].join(' ').toLowerCase();
        return hay.includes(q);
      });
      if (searchCount) searchCount.textContent = String(list.length);
      const html = list.slice(0, 120).map(renderCard).join('');
      searchResults.innerHTML = html || `<div class="panel-box"><p class="note">没有找到匹配结果，请尝试其他关键词。</p></div>`;
    };

    searchInput.addEventListener('input', refresh);
    refresh();
  }

  // Detail player with HLS
  const playerRoot = $('[data-player]');
  if (playerRoot) {
    const video = $('video', playerRoot);
    const buttons = $$('.source-button', playerRoot);
    const status = $('[data-player-status]', playerRoot);
    let hls = null;

    const setStatus = (msg) => {
      if (status) status.textContent = msg;
    };

    const destroyHls = () => {
      if (hls) {
        try { hls.destroy(); } catch (e) {}
        hls = null;
      }
    };

    const playUrl = (url, label) => {
      if (!video) return;
      buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.src === url));
      setStatus(`正在加载 ${label || '线路'} …`);
      destroyHls();

      const canNativeHls = video.canPlayType('application/vnd.apple.mpegurl');
      if (window.Hls && Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setStatus(`${label || '线路'} 已就绪，点击播放`);
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (evt, data) => {
          if (data && data.fatal) {
            setStatus('播放发生错误，请切换线路重试');
          }
        });
      } else if (canNativeHls) {
        video.src = url;
        video.addEventListener('loadedmetadata', () => setStatus(`${label || '线路'} 已就绪`), { once: true });
        video.addEventListener('error', () => setStatus('播放失败，请切换线路重试'), { once: true });
        video.play().catch(() => {});
      } else {
        setStatus('当前浏览器不支持 HLS 播放，请切换浏览器重试');
      }
    };

    buttons.forEach(btn => {
      btn.addEventListener('click', () => playUrl(btn.dataset.src, btn.dataset.label));
    });

    const initial = buttons[0];
    if (initial) {
      playUrl(initial.dataset.src, initial.dataset.label);
    }
  }

  // Simple category filter on pages with data-filterable cards
  const filterBar = $('[data-filter-bar]');
  if (filterBar) {
    const cards = $$('.movie-card[data-type]');
    const btns = $$('.filter-btn', filterBar);
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const value = btn.dataset.filter;
        cards.forEach(card => {
          const show = value === 'all' || card.dataset.type === value;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function trunc(str, n) {
    const s = String(str ?? '').replace(/\s+/g, ' ').trim();
    return s.length <= n ? s : s.slice(0, n - 1) + '…';
  }
})();
