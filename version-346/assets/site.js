(function () {
  var menuButton = document.querySelector('[data-menu-button]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }

    restart();
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-filter-root]')).forEach(function (root) {
    var input = root.querySelector('[data-search-input]');
    var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-filter-button]'));
    var container = root.parentElement || document;
    var items = Array.prototype.slice.call(container.querySelectorAll('.filter-item'));
    var empty = root.querySelector('[data-empty-state]');
    var activeKind = 'all';

    function applyFilter() {
      var query = input ? input.value.trim().toLowerCase() : '';
      var visible = 0;

      items.forEach(function (item) {
        var itemKind = item.getAttribute('data-kind') || '';
        var text = item.getAttribute('data-search') || item.textContent.toLowerCase();
        var matchKind = activeKind === 'all' || itemKind === activeKind;
        var matchText = !query || text.indexOf(query) !== -1;
        var showItem = matchKind && matchText;
        item.classList.toggle('hidden', !showItem);
        if (showItem) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle('show', visible === 0);
      }
    }

    if (input) {
      input.addEventListener('input', applyFilter);
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        activeKind = button.getAttribute('data-filter-button') || 'all';
        buttons.forEach(function (other) {
          other.classList.toggle('active', other === button);
        });
        applyFilter();
      });
    });
  });
})();
