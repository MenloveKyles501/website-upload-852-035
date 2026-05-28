(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupMenu() {
    var button = document.querySelector("[data-menu-button]");
    var menu = document.querySelector("[data-mobile-menu]");

    if (!button || !menu) {
      return;
    }

    button.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var slider = document.querySelector("[data-hero-slider]");

    if (!slider) {
      return;
    }

    var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-dot]"));
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        start();
      });
    });

    if (slides.length > 1) {
      show(0);
      start();
    }
  }

  function textOf(input) {
    return (input || "").toString().trim().toLowerCase();
  }

  function setupFilters() {
    var forms = Array.prototype.slice.call(document.querySelectorAll("[data-filter-form]"));

    forms.forEach(function (form) {
      var keywordInput = form.querySelector("[data-filter-keyword]");
      var typeSelect = form.querySelector("[data-filter-type]");
      var regionSelect = form.querySelector("[data-filter-region]");
      var yearSelect = form.querySelector("[data-filter-year]");
      var genreSelect = form.querySelector("[data-filter-genre]");
      var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));
      var empty = document.querySelector("[data-empty-state]");
      var params = new URLSearchParams(window.location.search);
      var query = params.get("q");

      if (query && keywordInput) {
        keywordInput.value = query;
      }

      function apply() {
        var keyword = textOf(keywordInput && keywordInput.value);
        var typeValue = textOf(typeSelect && typeSelect.value);
        var regionValue = textOf(regionSelect && regionSelect.value);
        var yearValue = textOf(yearSelect && yearSelect.value);
        var genreValue = textOf(genreSelect && genreSelect.value);
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = textOf(card.getAttribute("data-search"));
          var cardType = textOf(card.getAttribute("data-type"));
          var cardRegion = textOf(card.getAttribute("data-region"));
          var cardYear = textOf(card.getAttribute("data-year"));
          var cardGenre = textOf(card.getAttribute("data-genre"));
          var matched = true;

          if (keyword && haystack.indexOf(keyword) === -1) {
            matched = false;
          }

          if (typeValue && cardType !== typeValue) {
            matched = false;
          }

          if (regionValue && cardRegion !== regionValue) {
            matched = false;
          }

          if (yearValue && cardYear !== yearValue) {
            matched = false;
          }

          if (genreValue && cardGenre.indexOf(genreValue) === -1) {
            matched = false;
          }

          card.hidden = !matched;

          if (matched) {
            visible += 1;
          }
        });

        if (empty) {
          empty.classList.toggle("is-visible", visible === 0);
        }
      }

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        apply();
      });

      [keywordInput, typeSelect, regionSelect, yearSelect, genreSelect].forEach(function (control) {
        if (control) {
          control.addEventListener("input", apply);
          control.addEventListener("change", apply);
        }
      });

      apply();
    });
  }

  function setupPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));

    players.forEach(function (shell) {
      var video = shell.querySelector("video");
      var button = shell.querySelector("[data-play]");
      var status = shell.querySelector("[data-player-status]");
      var started = false;
      var hls = null;

      if (!video || !button) {
        return;
      }

      function setStatus(message) {
        if (!status) {
          return;
        }
        status.textContent = message;
        status.classList.add("is-visible");
      }

      function hideStatus() {
        if (status) {
          status.classList.remove("is-visible");
        }
      }

      function playVideo() {
        var result = video.play();

        if (result && typeof result.catch === "function") {
          result.catch(function () {
            setStatus("点击视频继续播放");
          });
        }
      }

      function attachStream() {
        var stream = video.getAttribute("data-stream");

        if (!stream) {
          setStatus("播放源暂不可用");
          return;
        }

        if (started) {
          shell.classList.add("is-playing");
          playVideo();
          return;
        }

        started = true;
        shell.classList.add("is-playing");
        setStatus("正在加载");

        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90
          });
          hls.loadSource(stream);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            hideStatus();
            playVideo();
          });
          hls.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              setStatus("播放连接正在重试");
              if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
              } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              }
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = stream;
          video.addEventListener("loadedmetadata", function () {
            hideStatus();
            playVideo();
          }, { once: true });
          video.load();
        } else {
          video.src = stream;
          video.load();
          playVideo();
        }
      }

      button.addEventListener("click", attachStream);
      video.addEventListener("play", function () {
        shell.classList.add("is-playing");
        hideStatus();
      });
      window.addEventListener("beforeunload", function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
    setupPlayers();
  });
})();
