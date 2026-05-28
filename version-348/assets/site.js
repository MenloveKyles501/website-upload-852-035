function initNavigation() {
  var toggle = document.querySelector('[data-nav-toggle]');
  var menu = document.querySelector('[data-nav-menu]');
  var search = document.querySelector('[data-nav-search]');
  if (!toggle || !menu) {
    return;
  }
  toggle.addEventListener('click', function () {
    menu.classList.toggle('is-open');
    if (search) {
      search.classList.toggle('is-open');
    }
  });
}

function initHero() {
  var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
  if (slides.length === 0) {
    return;
  }
  var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
  var next = document.querySelector('[data-hero-next]');
  var prev = document.querySelector('[data-hero-prev]');
  var active = 0;

  function show(index) {
    active = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('is-active', slideIndex === active);
    });
    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('is-active', dotIndex === active);
    });
  }

  if (next) {
    next.addEventListener('click', function () {
      show(active + 1);
    });
  }
  if (prev) {
    prev.addEventListener('click', function () {
      show(active - 1);
    });
  }
  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () {
      show(index);
    });
  });
  setInterval(function () {
    show(active + 1);
  }, 5600);
  show(0);
}

function initFilter() {
  var input = document.querySelector('[data-filter-input]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
  var empty = document.querySelector('[data-empty-state]');
  if (!input || cards.length === 0) {
    return;
  }
  var params = new URLSearchParams(window.location.search);
  var query = params.get('q');
  if (query) {
    input.value = query;
  }

  function applyFilter() {
    var value = input.value.trim().toLowerCase();
    var visible = 0;
    cards.forEach(function (card) {
      var haystack = [
        card.getAttribute('data-title'),
        card.getAttribute('data-region'),
        card.getAttribute('data-genre'),
        card.getAttribute('data-tags'),
        card.textContent
      ].join(' ').toLowerCase();
      var match = !value || haystack.indexOf(value) !== -1;
      card.style.display = match ? '' : 'none';
      if (match) {
        visible += 1;
      }
    });
    if (empty) {
      empty.style.display = visible === 0 ? 'block' : 'none';
    }
  }

  input.addEventListener('input', applyFilter);
  applyFilter();
}

function initMoviePlayer(sourceUrl) {
  var video = document.getElementById('movie-player');
  var overlay = document.querySelector('[data-play-button]');
  if (!video || !sourceUrl) {
    return;
  }
  var attached = false;

  function attachSource() {
    if (attached) {
      return;
    }
    attached = true;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = sourceUrl;
    } else if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls();
      hls.loadSource(sourceUrl);
      hls.attachMedia(video);
    } else {
      video.src = sourceUrl;
    }
  }

  function startPlayback() {
    attachSource();
    if (overlay) {
      overlay.classList.add('is-hidden');
    }
    var playTask = video.play();
    if (playTask && playTask.catch) {
      playTask.catch(function () {});
    }
  }

  if (overlay) {
    overlay.addEventListener('click', startPlayback);
  }
  video.addEventListener('click', function () {
    if (!attached) {
      startPlayback();
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initNavigation();
  initHero();
  initFilter();
});
