(function () {
  const doc = document;
  const body = doc.body;

  function qs(sel, root = doc) {
    return root.querySelector(sel);
  }

  function qsa(sel, root = doc) {
    return Array.from(root.querySelectorAll(sel));
  }

  function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function normalize(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function setActiveNav() {
    const path = location.pathname.split('/').pop() || 'index.html';
    qsa('.nav a').forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;
      if (href === path) a.classList.add('active');
    });
  }

  function setupMobileNav() {
    const toggle = qs('[data-nav-toggle]');
    const nav = qs('.nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }

  function setupHeroSlider() {
    const slider = qs('[data-hero-slider]');
    if (!slider) return;
    const slides = qsa('.slide', slider);
    const dots = qsa('[data-slide-dot]', slider);
    if (!slides.length) return;

    let index = 0;
    let timer = null;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((slide, idx) => slide.classList.toggle('active', idx === index));
      dots.forEach((dot, idx) => dot.classList.toggle('active', idx === index));
    }

    function next() {
      show(index + 1);
    }

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        show(idx);
        restart();
      });
    });

    function restart() {
      if (timer) clearInterval(timer);
      timer = setInterval(next, 4200);
    }

    show(0);
    restart();

    slider.addEventListener('mouseenter', () => timer && clearInterval(timer));
    slider.addEventListener('mouseleave', restart);
  }

  function buildCardSearchIndex(card) {
    return normalize([
      card.dataset.title,
      card.dataset.genre,
      card.dataset.region,
      card.dataset.type,
      card.dataset.year,
      card.dataset.tags
    ].join(' '));
  }

  function setupFilterBar() {
    const searchInput = qs('[data-filter-input]');
    const genreSelect = qs('[data-filter-genre]');
    const regionSelect = qs('[data-filter-region]');
    const yearSelect = qs('[data-filter-year]');
    const list = qs('[data-card-list]');
    if (!searchInput || !list) return;

    const cards = qsa('[data-card-item]', list);
    const noResults = qs('[data-empty-state]');
    cards.forEach(card => {
      card.dataset.searchIndex = buildCardSearchIndex(card);
    });

    function apply() {
      const kw = normalize(searchInput.value);
      const genre = normalize(genreSelect ? genreSelect.value : '');
      const region = normalize(regionSelect ? regionSelect.value : '');
      const year = normalize(yearSelect ? yearSelect.value : '');

      let visible = 0;
      cards.forEach(card => {
        const okKw = !kw || card.dataset.searchIndex.includes(kw);
        const okGenre = !genre || normalize(card.dataset.genre).includes(genre);
        const okRegion = !region || normalize(card.dataset.region).includes(region);
        const okYear = !year || String(card.dataset.year) === year;
        const show = okKw && okGenre && okRegion && okYear;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      if (noResults) noResults.hidden = visible !== 0;
    }

    searchInput.addEventListener('input', apply);
    if (genreSelect) genreSelect.addEventListener('change', apply);
    if (regionSelect) regionSelect.addEventListener('change', apply);
    if (yearSelect) yearSelect.addEventListener('change', apply);
    apply();
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (qsa(`script[src="${src}"]`).length) {
        resolve();
        return;
      }
      const s = doc.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      doc.head.appendChild(s);
    });
  }

  async function ensureHls() {
    if (window.Hls) return window.Hls;
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/hls.js@latest');
    } catch (e) {
      return null;
    }
    return window.Hls || null;
  }

  function setupPlayer() {
    const shell = qs('[data-player-shell]');
    if (!shell) return;
    const video = qs('video', shell);
    const overlay = qs('[data-player-overlay]', shell);
    const playBtn = qs('[data-play-btn]', shell);
    if (!video || !overlay || !playBtn) return;

    const m3u8 = shell.dataset.hls || '';
    const mp4 = shell.dataset.mp4 || '';
    let started = false;

    async function startPlayback() {
      if (started) {
        try { await video.play(); } catch (e) {}
        return;
      }

      const canNativeHls = video.canPlayType && video.canPlayType('application/vnd.apple.mpegurl');
      if (m3u8 && canNativeHls) {
        video.src = m3u8;
      } else if (m3u8) {
        const Hls = await ensureHls();
        if (Hls) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(m3u8);
          hls.attachMedia(video);
          window.__movieHls = window.__movieHls || [];
          window.__movieHls.push(hls);
        } else if (mp4) {
          video.src = mp4;
        }
      } else if (mp4) {
        video.src = mp4;
      }

      started = true;
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      try {
        await video.play();
      } catch (e) {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
      }
    }

    overlay.addEventListener('click', startPlayback);
    playBtn.addEventListener('click', startPlayback);
    video.addEventListener('click', () => {
      if (video.paused) startPlayback();
    });
  }

  function setupLazyImages() {
    qsa('img[data-fallback]').forEach(img => {
      img.addEventListener('error', function onError() {
        if (!img.dataset.fallback) return;
        img.onerror = null;
        img.src = img.dataset.fallback;
      });
    });
  }

  function setupSearchPage() {
    const mount = qs('[data-global-search]');
    if (!mount || !window.FILMS_DATA) return;
    const input = qs('[data-search-input]', mount);
    const list = qs('[data-search-results]', mount);
    const total = qs('[data-search-total]', mount);
    const region = qs('[data-search-region]', mount);
    const genre = qs('[data-search-genre]', mount);
    const year = qs('[data-search-year]', mount);

    const data = Array.isArray(window.FILMS_DATA) ? window.FILMS_DATA : [];
    const pageSize = 24;
    let visibleData = data.slice();

    const urlParams = new URLSearchParams(location.search);
    const initialQ = urlParams.get('q') || '';
    if (input && initialQ) input.value = initialQ;

    function render() {
      const kw = normalize(input ? input.value : '');
      const regionVal = normalize(region ? region.value : '');
      const genreVal = normalize(genre ? genre.value : '');
      const yearVal = normalize(year ? year.value : '');

      visibleData = data.filter(item => {
        const hay = normalize([item.title, item.region, item.genre, item.type, item.tags.join(' '), item.one_line].join(' '));
        const okKw = !kw || hay.includes(kw);
        const okRegion = !regionVal || normalize(item.region).includes(regionVal);
        const okGenre = !genreVal || normalize(item.genre).includes(genreVal);
        const okYear = !yearVal || String(item.year) === yearVal;
        return okKw && okRegion && okGenre && okYear;
      });

      if (total) total.textContent = String(visibleData.length);
      if (!list) return;
      list.innerHTML = visibleData.slice(0, pageSize).map(item => `
        <article class="card" data-card-item data-title="${item.title}" data-region="${item.region}" data-genre="${item.genre}" data-year="${item.year}" data-type="${item.type}" data-tags="${item.tags.join(' ')}">
          <a href="${item.url}">
            <div class="poster">
              <img src="./${item.poster}.jpg" alt="${item.title}" data-fallback="${item.fallback}">
            </div>
            <div class="card-body">
              <div class="card-topline">
                <h3 class="card-title">${item.title}</h3>
                <span class="year-badge">${item.year}</span>
              </div>
              <div class="card-meta">
                <span class="meta-pill">${item.region}</span>
                <span class="meta-pill">${item.genre}</span>
              </div>
              <p class="card-desc">${item.one_line}</p>
            </div>
          </a>
        </article>
      `).join('');
      setupLazyImages();
    }

    input && input.addEventListener('input', render);
    region && region.addEventListener('change', render);
    genre && genre.addEventListener('change', render);
    year && year.addEventListener('change', render);
    render();
  }

  function init() {
    setActiveNav();
    setupMobileNav();
    setupHeroSlider();
    setupFilterBar();
    setupPlayer();
    setupLazyImages();
    setupSearchPage();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
