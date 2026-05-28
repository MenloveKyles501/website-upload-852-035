(function () {
    const toggle = document.querySelector("[data-menu-toggle]");
    const mobileNav = document.querySelector("[data-mobile-nav]");

    if (toggle && mobileNav) {
        toggle.addEventListener("click", function () {
            mobileNav.classList.toggle("is-open");
        });
    }

    const hero = document.querySelector("[data-hero]");

    if (hero) {
        const slides = Array.from(hero.querySelectorAll("[data-hero-slide]"));
        const dots = Array.from(hero.querySelectorAll("[data-hero-dot]"));
        let current = 0;

        function showSlide(index) {
            if (!slides.length) {
                return;
            }

            current = (index + slides.length) % slides.length;

            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
            });

            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === current);
            });
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener("click", function () {
                showSlide(index);
            });
        });

        showSlide(0);

        window.setInterval(function () {
            showSlide(current + 1);
        }, 5600);
    }

    const searchInputs = Array.from(document.querySelectorAll("[data-search-input]"));

    function normalize(value) {
        return String(value || "").trim().toLowerCase();
    }

    function filterCards(input) {
        const scopeSelector = input.getAttribute("data-search-scope") || "body";
        const scope = document.querySelector(scopeSelector) || document.body;
        const cards = Array.from(scope.querySelectorAll("[data-movie-card]"));
        const query = normalize(input.value);

        cards.forEach(function (card) {
            const haystack = normalize([
                card.getAttribute("data-title"),
                card.getAttribute("data-genre"),
                card.getAttribute("data-region"),
                card.getAttribute("data-year"),
                card.textContent
            ].join(" "));

            card.classList.toggle("is-hidden", query && haystack.indexOf(query) === -1);
        });
    }

    searchInputs.forEach(function (input) {
        input.addEventListener("input", function () {
            filterCards(input);
        });
    });

    const filterButtons = Array.from(document.querySelectorAll("[data-filter-value]"));

    filterButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const value = normalize(button.getAttribute("data-filter-value"));
            const scopeSelector = button.getAttribute("data-filter-scope") || "body";
            const scope = document.querySelector(scopeSelector) || document.body;
            const cards = Array.from(scope.querySelectorAll("[data-movie-card]"));

            filterButtons.forEach(function (item) {
                if ((item.getAttribute("data-filter-scope") || "body") === scopeSelector) {
                    item.classList.toggle("is-active", item === button);
                }
            });

            cards.forEach(function (card) {
                const genre = normalize(card.getAttribute("data-genre"));
                const year = normalize(card.getAttribute("data-year"));
                const region = normalize(card.getAttribute("data-region"));
                const title = normalize(card.getAttribute("data-title"));
                const haystack = [genre, year, region, title, normalize(card.textContent)].join(" ");
                card.classList.toggle("is-hidden", value !== "all" && haystack.indexOf(value) === -1);
            });
        });
    });
}());
