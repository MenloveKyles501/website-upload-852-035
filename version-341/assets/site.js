(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function setupMenu() {
        var toggle = document.querySelector("[data-menu-toggle]");
        var menu = document.querySelector("[data-site-menu]");
        if (!toggle || !menu) {
            return;
        }
        toggle.addEventListener("click", function () {
            menu.classList.toggle("is-open");
        });
    }

    function setupHero() {
        var root = document.querySelector("[data-hero]");
        if (!root) {
            return;
        }
        var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
        var prev = root.querySelector("[data-hero-prev]");
        var next = root.querySelector("[data-hero-next]");
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                var active = slideIndex === index;
                slide.classList.toggle("is-active", active);
                slide.setAttribute("aria-hidden", active ? "false" : "true");
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 6000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                start();
            });
        }
        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                start();
            });
        });
        root.addEventListener("mouseenter", stop);
        root.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function setupFilters() {
        var input = document.querySelector("[data-filter-input]");
        var chips = Array.prototype.slice.call(document.querySelectorAll("[data-filter-chip]"));
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));
        if (!cards.length) {
            return;
        }

        function applyFilter(value) {
            var keyword = String(value || "").trim().toLowerCase();
            cards.forEach(function (card) {
                var text = String(card.getAttribute("data-filter-text") || card.textContent || "").toLowerCase();
                card.classList.toggle("is-filtered-out", keyword !== "" && text.indexOf(keyword) === -1);
            });
        }

        if (input) {
            input.addEventListener("input", function () {
                applyFilter(input.value);
            });
        }
        chips.forEach(function (chip) {
            chip.addEventListener("click", function () {
                chips.forEach(function (item) {
                    item.classList.remove("is-active");
                });
                chip.classList.add("is-active");
                var value = chip.getAttribute("data-filter-chip") || "";
                if (input) {
                    input.value = value;
                }
                applyFilter(value);
            });
        });
    }

    function setupPosters() {
        Array.prototype.slice.call(document.querySelectorAll(".poster-link img, .hero-poster img, .side-poster img, .category-covers img, .category-preview img")).forEach(function (image) {
            image.addEventListener("error", function () {
                image.classList.add("image-missing");
            });
        });
    }

    function setupPlayer() {
        var video = document.querySelector("[data-player]");
        if (!video) {
            return;
        }
        var source = video.getAttribute("data-stream") || "";
        var overlay = document.querySelector("[data-play-overlay]");
        var message = document.querySelector("[data-player-message]");
        var player = null;

        function showMessage(text) {
            if (message) {
                message.textContent = text;
                message.classList.add("is-visible");
            }
        }

        function hideOverlay() {
            if (overlay) {
                overlay.classList.add("is-hidden");
            }
        }

        function playVideo() {
            hideOverlay();
            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(function () {});
            }
        }

        if (source && window.Hls && window.Hls.isSupported()) {
            player = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            });
            player.loadSource(source);
            player.attachMedia(video);
            player.on(window.Hls.Events.ERROR, function (eventName, data) {
                if (!data || !data.fatal) {
                    return;
                }
                if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                    showMessage("网络连接异常，正在重新加载视频。");
                    player.startLoad();
                } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                    showMessage("媒体加载异常，正在恢复播放。");
                    player.recoverMediaError();
                } else {
                    showMessage("视频暂时无法播放，请刷新页面重试。");
                    player.destroy();
                }
            });
        } else if (source && video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = source;
        } else if (!source) {
            showMessage("视频源暂时不可用。");
        } else {
            showMessage("当前浏览器无法初始化视频，请更换现代浏览器重试。");
        }

        if (overlay) {
            overlay.addEventListener("click", playVideo);
        }
        video.addEventListener("play", hideOverlay);
        video.addEventListener("click", function () {
            if (video.paused) {
                playVideo();
            }
        });
        window.addEventListener("beforeunload", function () {
            if (player) {
                player.destroy();
            }
        });
    }

    ready(function () {
        setupMenu();
        setupHero();
        setupFilters();
        setupPosters();
        setupPlayer();
    });
})();
