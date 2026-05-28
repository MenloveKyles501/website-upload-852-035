(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  ready(function () {
    var toggle = document.querySelector('[data-menu-toggle]');
    var mobileNav = document.querySelector('[data-mobile-nav]');

    if (toggle && mobileNav) {
      toggle.addEventListener('click', function () {
        mobileNav.classList.toggle('open');
      });
    }

    initHero();
    initSearch();
  });

  function initHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    var prev = document.querySelector('[data-hero-prev]');
    var next = document.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    if (!slides.length) {
      return;
    }

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    function restart() {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        restart();
      });
    }

    show(0);
    restart();
  }

  function initSearch() {
    var input = document.querySelector('[data-search-input]');
    var results = document.querySelector('[data-search-results]');

    if (!input || !results || !window.MOVIES_SEARCH_DATA) {
      return;
    }

    function matchMovie(movie, query) {
      var source = [
        movie.title,
        movie.region,
        movie.type,
        movie.year,
        movie.genre,
        movie.description,
        (movie.tags || []).join(' ')
      ].join(' ').toLowerCase();

      return source.indexOf(query) !== -1;
    }

    function render(items) {
      if (!items.length) {
        results.innerHTML = '<div class="search-result-item"><div></div><p>没有找到匹配影片</p></div>';
        results.classList.add('open');
        return;
      }

      results.innerHTML = items.slice(0, 12).map(function (movie) {
        return [
          '<a class="search-result-item" href="' + escapeAttr(movie.url) + '">',
          '<img src="' + escapeAttr(movie.image) + '" alt="' + escapeAttr(movie.title) + '">',
          '<span>',
          '<strong>' + escapeHtml(movie.title) + '</strong>',
          '<p>' + escapeHtml(movie.region + ' · ' + movie.type + ' · ' + movie.year + ' · ⭐ ' + movie.rating) + '</p>',
          '</span>',
          '</a>'
        ].join('');
      }).join('');
      results.classList.add('open');
    }

    input.addEventListener('input', function () {
      var query = input.value.trim().toLowerCase();
      if (!query) {
        results.classList.remove('open');
        results.innerHTML = '';
        return;
      }
      render(window.MOVIES_SEARCH_DATA.filter(function (movie) {
        return matchMovie(movie, query);
      }));
    });

    document.addEventListener('click', function (event) {
      if (!results.contains(event.target) && event.target !== input) {
        results.classList.remove('open');
      }
    });
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
  }
})();
