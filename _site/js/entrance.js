(function () {

    /* ==================================================
                    НАСТРОЙКИ
    ================================================== */

    const MOBILE_BREAKPOINT = 1024;

   const MAX_WIDTH  = 1080;   // было 900
    const MAX_HEIGHT = 660;    // было 580
    const MARGIN     = 24;

    const TAB_WIDTH   = 64;
    const TAB_HEIGHT  = 152;
    const TAB_GAP     = 16;
    const TAB_TOP_MARGIN = 16;

    /* Альбомная ориентация: вкладки выглядывают СНИЗУ экрана
       в один ряд, а не столбиками слева/справа.
       TAB_WIDTH_LANDSCAPE теперь используется как ЖЕЛАЕМАЯ
       (максимальная) ширина одной вкладки — фактическая ширина
       вычисляется в layoutTabsBottom() под реальную ширину
       экрана, чтобы все вкладки гарантированно помещались в
       один ряд и не вылезали за край на узких телефонах.
       MIN_TAB_WIDTH_LANDSCAPE — нижняя граница, чтобы вкладка
       не схлопывалась до нечитаемого размера на совсем узких
       экранах (там при необходимости появится горизонтальный
       скролл вкладок вместо неюзабельно узких плиток). */
    const TAB_WIDTH_LANDSCAPE       = 160;
    const MIN_TAB_WIDTH_LANDSCAPE    = 96;
    const TAB_HEIGHT_LANDSCAPE      = 84;
    const TAB_GAP_LANDSCAPE         = 14;
    const TAB_SIDE_MARGIN_LANDSCAPE = 16;

    const PANEL_MAX_WIDTH_RATIO  = .88;
    const PANEL_MAX_HEIGHT_RATIO = .78;
    const PANEL_SIDE_MARGIN = 12;
    const PANEL_VERT_MARGIN = 16;

    let activeCard = null;
    let activeInner = null;
    let overlay = null;
    let isMobileExpand = false;

    function isMobile() {
        return window.innerWidth <= MOBILE_BREAKPOINT;
    }

    // Альбомная ориентация телефона/планшета.
    // ВАЖНО: используем matchMedia('orientation'), а не сравнение
    // innerWidth > innerHeight. Сразу после физического поворота
    // телефона (особенно в iOS Safari) innerWidth/innerHeight ещё
    // какое-то время отдают старые значения — из-за анимации
    // поворота и скрытия/показа адресной строки браузер обновляет
    // их с задержкой. matchMedia('orientation') отражает реальную
    // ориентацию экрана сразу, без этой задержки.
    const landscapeMql = window.matchMedia('(orientation: landscape)');

    function isLandscapeMobile() {
        return isMobile() && landscapeMql.matches;
    }

    function getHeaderHeight() {
        const header =
            document.querySelector('.header') ||
            document.querySelector('header');

        return header ? header.getBoundingClientRect().height : 0;
    }

    function ensureOverlay() {
        if (overlay) return overlay;

        overlay = document.createElement('div');
        overlay.className = 'cardsOverlay';
        document.body.appendChild(overlay);

        overlay.addEventListener('click', () => {
            if (activeCard) collapseCard();
        });

        return overlay;
    }


    /* ==================================================
            МОБИЛЬНЫЙ РЕЖИМ — раскладка вкладок
    ================================================== */

    const cards = Array.from(document.querySelectorAll('.card'));

    function layoutTabs() {
        if (!isMobile()) return;

        layoutTabsBottom();
    }

    // ПОРТРЕТ — прежнее поведение: столбики вкладок слева/справа.
    function layoutTabsSide() {
        const topStart = getHeaderHeight() + TAB_TOP_MARGIN;
        let leftCount = 0;
        let rightCount = 0;

        cards.forEach((card, i) => {
            if (card.classList.contains('is-expanded')) return;

            const side = i % 2 === 0 ? 'left' : 'right';
            const slot = side === 'left' ? leftCount++ : rightCount++;
            const top = topStart + slot * (TAB_HEIGHT + TAB_GAP);

            // левый край считаем явным числом даже для правой
            // стороны — чтобы при повороте transition анимировал
            // именно left, а не прыгал через right -> auto
            const left = side === 'left' ? 0 : (window.innerWidth - TAB_WIDTH);

            card.dataset.side = side;

            card.style.left = left + 'px';
            card.style.right = '';
            card.style.bottom = '';
            card.style.top = top + 'px';
            card.style.width = TAB_WIDTH + 'px';
            card.style.height = TAB_HEIGHT + 'px';
        });
    }

    // Раскладка вкладок в один ряд снизу экрана. Ширина вкладки
    // считается под фактическую ширину экрана — так три вкладки
    // ВСЕГДА помещаются в один ряд без горизонтального переполнения,
    // вместо жёстко заданного пикселя, который на узких телефонах
    // не влезал (160×3 + отступы легко превышало ширину экрана).
    function layoutTabsBottom() {
        const visibleCards = cards.filter(
            card => !card.classList.contains('is-expanded')
        );
        const count = visibleCards.length;
        if (!count) return;

        const sideMargin = TAB_SIDE_MARGIN_LANDSCAPE;
        const totalGap = Math.max(0, count - 1) * TAB_GAP_LANDSCAPE;

        // сколько места реально есть под сами вкладки (без отступов
        // по бокам и зазоров между вкладками)
        const availableForTabs = window.innerWidth - sideMargin * 2 - totalGap;

        // делим поровну между вкладками, но не шире желаемого
        // максимума (TAB_WIDTH_LANDSCAPE) и не уже минимума
        let tabWidth = availableForTabs / count;
        tabWidth = Math.min(tabWidth, TAB_WIDTH_LANDSCAPE);
        tabWidth = Math.max(tabWidth, MIN_TAB_WIDTH_LANDSCAPE);

        const totalWidth = tabWidth * count + totalGap;

        const startLeft = Math.max(
            sideMargin,
            (window.innerWidth - totalWidth) / 2
        );

        // top вместо bottom — по той же причине: чтобы transition
        // анимировал числовое значение, а не auto <-> px
        const top = window.innerHeight - TAB_HEIGHT_LANDSCAPE;

        visibleCards.forEach((card, slot) => {
            const left = startLeft + slot * (tabWidth + TAB_GAP_LANDSCAPE);

            card.dataset.side = 'bottom';

            card.style.left = left + 'px';
            card.style.right = '';
            card.style.top = top + 'px';
            card.style.bottom = '';
            card.style.width = tabWidth + 'px';
            card.style.height = TAB_HEIGHT_LANDSCAPE + 'px';
        });
    }


    function layoutTabsAnimated() {
        if (!isMobile()) return;

        // ДО пересчёта запоминаем текущее положение каждой вкладки
        const firstRects = new Map();
        cards.forEach(card => {
            if (card.classList.contains('is-expanded')) return;
            firstRects.set(card, card.getBoundingClientRect());
        });

        // мгновенно (без transition) ставим карточки в финальную
        // позицию — именно left/top/width/height, transition на них
        // всё равно не сработает во время поворота экрана, поэтому
        // даже не пытаемся его использовать
        cards.forEach(card => {
            if (!card.classList.contains('is-expanded')) {
                card.style.transition = 'none';
            }
        });

        layoutTabs();

        // FLIP: инвертируем — временно "возвращаем" карточку туда,
        // где она была визуально, через transform (не layout!)
        cards.forEach(card => {
            if (card.classList.contains('is-expanded')) return;

            const first = firstRects.get(card);
            if (!first) return;

            const last = card.getBoundingClientRect();
            if (!last.width || !last.height) return;

            const dx = first.left - last.left;
            const dy = first.top - last.top;
            const sx = first.width / last.width;
            const sy = first.height / last.height;

            card.style.transformOrigin = 'top left';
            card.style.transform =
                `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
        });

        // форсируем reflow, чтобы браузер зафиксировал это
        // "инвертированное" положение перед тем, как включим анимацию
        void document.body.offsetHeight;

        // PLAY: включаем transition ТОЛЬКО на transform и убираем его —
        // карточка плавно "доезжает" из старого места в новое
        cards.forEach(card => {
            if (card.classList.contains('is-expanded')) return;

            card.style.transition = 'transform .4s cubic-bezier(.2,.8,.2,1)';
            card.style.transform = '';
        });

        cards.forEach(card => {
            card.addEventListener('transitionend', function onEnd(e) {
                if (e.propertyName !== 'transform' || e.target !== card) return;
                card.style.transition = '';
                card.style.transform = '';
                card.style.transformOrigin = '';
                card.removeEventListener('transitionend', onEnd);
            });
        });
    }


    // Сброс инлайн-стилей, которые layoutTabs()/expandMobile()
    // проставляют карточкам в мобильном режиме (left/right/top/
    // bottom/width/height, data-side). Эти инлайн-стили сильнее
    // любых правил из @media, поэтому при возврате на широкий
    // экран их обязательно нужно чистить вручную — иначе
    // десктопная раскладка (иконки в сетке) не может вернуться
    // на место.
    function resetDesktopLayout() {
        cards.forEach(card => {
            if (card.classList.contains('is-expanded')) return;

            card.style.left = '';
            card.style.right = '';
            card.style.top = '';
            card.style.bottom = '';
            card.style.width = '';
            card.style.height = '';

            delete card.dataset.side;
            delete card._homeRect;
        });
    }

    function getMobilePanelRect() {
        const headerH = getHeaderHeight();

        // ВАЖНО: берём document.documentElement.clientWidth, а НЕ
        // window.innerWidth. innerWidth включает в себя ширину
        // системного полосы прокрутки (если она есть), из-за чего
        // ширина панели могла на несколько пикселей превышать
        // реально видимую область экрана — именно это и вызывало
        // горизонтальный скролл у раскрытых карточек на мобильном.
        const viewportWidth = document.documentElement.clientWidth;

        const availWidth = viewportWidth - PANEL_SIDE_MARGIN * 2;
        const availHeight = window.innerHeight - headerH - PANEL_VERT_MARGIN * 2;

        const width = Math.min(viewportWidth * PANEL_MAX_WIDTH_RATIO, availWidth);
        const height = Math.min(window.innerHeight * PANEL_MAX_HEIGHT_RATIO, availHeight);
        const top = headerH + Math.max(PANEL_VERT_MARGIN, (availHeight - height) / 2);

        return { width, height, top };
    }


    /* ==================================================
                ОТКРЫТИЕ / ЗАКРЫТИЕ — ДЕСКТОП
    ================================================== */

    function getDesktopTargetRect() {
        const topLimit = getHeaderHeight() + MARGIN;

        const availWidth  = window.innerWidth - MARGIN * 2;
        const availHeight = window.innerHeight - topLimit - MARGIN;

        const width  = Math.min(MAX_WIDTH, availWidth);
        const height = Math.min(MAX_HEIGHT, availHeight);

        return {
            left: (window.innerWidth - width) / 2,
            top: topLimit + Math.max(0, (availHeight - height) / 2),
            width,
            height
        };
    }

    function expandDesktop(card) {
        const inner = card.querySelector('.cardInner');
        const rect = inner.getBoundingClientRect();

        inner._originalParent = card;
        inner._originalNextSibling = inner.nextSibling;

        inner.style.position = 'fixed';
        inner.style.left = rect.left + 'px';
        inner.style.top = rect.top + 'px';
        inner.style.width = rect.width + 'px';
        inner.style.height = rect.height + 'px';
        inner.style.transform = 'none';
        inner.style.bottom = 'auto';
        inner.style.margin = '0';

        document.body.appendChild(inner);

        inner.offsetHeight;

        card.classList.add('is-expanded');
        inner.classList.add('is-expanded');

        const target = getDesktopTargetRect();
        inner.style.left = target.left + 'px';
        inner.style.top = target.top + 'px';
        inner.style.width = target.width + 'px';
        inner.style.height = target.height + 'px';

        activeInner = inner;
    }

    function collapseDesktop() {
        const card = activeCard;
        const inner = activeInner;

        card.classList.remove('is-expanded');
        inner.classList.remove('is-expanded');

        const cardRect = card.getBoundingClientRect();

        inner.style.left = cardRect.left + 'px';
        inner.style.top = cardRect.top + 'px';
        inner.style.width = cardRect.width + 'px';
        inner.style.height = '150px';

        function onTransitionEnd(e) {
            if (e.target !== inner) return;

            if (inner._originalNextSibling) {
                inner._originalParent.insertBefore(inner, inner._originalNextSibling);
            } else {
                inner._originalParent.appendChild(inner);
            }

            inner.style.position = '';
            inner.style.left = '';
            inner.style.top = '';
            inner.style.width = '';
            inner.style.height = '';
            inner.style.transform = '';
            inner.style.bottom = '';
            inner.style.margin = '';

            delete inner._originalParent;
            delete inner._originalNextSibling;

            inner.removeEventListener('transitionend', onTransitionEnd);
        }
        inner.addEventListener('transitionend', onTransitionEnd);
    }


    /* ==================================================
            ОТКРЫТИЕ / ЗАКРЫТИЕ — МОБИЛЬНЫЙ
    ================================================== */

    // Единая функция позиционирования развёрнутой панели на
    // мобильном — используется и при открытии, и при resize/
    // повороте экрана, чтобы не дублировать логику для каждого
    // из трёх вариантов исходной стороны (left/right/bottom).
    function applyMobilePanelPosition(card, panel, side) {
        card.style.width = panel.width + 'px';
        card.style.height = panel.height + 'px';

        if (side === 'bottom') {
            card.style.left = ((window.innerWidth - panel.width) / 2) + 'px';
            card.style.right = '';
            card.style.top = panel.top + 'px';
            card.style.bottom = '';
        } else {
            card.style.top = panel.top + 'px';
            card.style.bottom = '';

            if (side === 'left') {
                card.style.left = '0px';
                card.style.right = '';
            } else {
                card.style.right = '0px';
                card.style.left = '';
            }
        }
    }

    function expandMobile(card) {
        const inner = card.querySelector('.cardInner');
        const side = card.dataset.side;

        // Запоминаем ТОЧНЫЕ координаты вкладки до её изменения —
        // именно сюда карточка должна вернуться при закрытии.
        const rect = card.getBoundingClientRect();
        card._homeRect = {
            left: rect.left,
            right: window.innerWidth - rect.right,
            top: rect.top,
            bottom: window.innerHeight - rect.bottom,
            width: rect.width,
            height: rect.height
        };

        card.classList.add('is-expanded');
        inner.classList.add('is-expanded');

        const panel = getMobilePanelRect();
        applyMobilePanelPosition(card, panel, side);

        activeInner = inner;
    }

    function collapseMobile() {
        const card = activeCard;
        const inner = activeInner;

        card.classList.remove('is-expanded');
        inner.classList.remove('is-expanded');

        const home = card._homeRect;
        const side = card.dataset.side;

        // возвращаемся ИМЕННО в те координаты, откуда открывались —
        // без пересчёта, поэтому попадание всегда точное
        if (home) {
            card.style.width = home.width + 'px';
            card.style.height = home.height + 'px';

            if (side === 'bottom') {
                card.style.left = home.left + 'px';
                card.style.right = '';
                card.style.top = '';
                card.style.bottom = '0px';
            } else {
                card.style.top = home.top + 'px';
                card.style.bottom = '';

                if (side === 'left') {
                    card.style.left = '0px';
                    card.style.right = '';
                } else {
                    card.style.right = '0px';
                    card.style.left = '';
                }
            }
        }

        function onTransitionEnd(e) {
            if (e.target !== card) return;
            card.removeEventListener('transitionend', onTransitionEnd);

            // после завершения анимации синхронизируем со всеми
            // остальными вкладками — на случай, если пока карточка
            // была открыта, поменялась высота хедера/окна или
            // ориентация экрана.
            // Проверяем текущий режим: если пока карточка была
            // раскрыта пользователь успел развернуть окно на
            // десктоп — чистим мобильные стили вместо того, чтобы
            // заново расставлять вкладки.
            if (isMobile()) {
                layoutTabs();
            } else {
                resetDesktopLayout();
            }
        }
        card.addEventListener('transitionend', onTransitionEnd);
    }


    /* ==================================================
                    ОБЩИЙ ИНТЕРФЕЙС
    ================================================== */

    function expandCard(card) {
        if (activeCard === card) return;
        if (activeCard) collapseCard();

        isMobileExpand = isMobile();

        if (isMobileExpand) {
            expandMobile(card);
        } else {
            expandDesktop(card);
        }

        const ov = ensureOverlay();
        ov.offsetHeight;
        ov.classList.add('is-visible');

        activeCard = card;
        document.addEventListener('keydown', onKeyDown);
    }

    function collapseCard() {
        if (!activeCard) return;

        if (isMobileExpand) {
            collapseMobile();
        } else {
            collapseDesktop();
        }

        if (overlay) overlay.classList.remove('is-visible');

        activeCard = null;
        activeInner = null;
        document.removeEventListener('keydown', onKeyDown);
    }

    function onKeyDown(e) {
        if (e.key === 'Escape' && activeCard) {
            collapseCard();
        }
    }


    /* ==================================================
                    ОБРАБОТЧИКИ
    ================================================== */

    cards.forEach(card => {
        card.addEventListener('click', () => {
            if (activeCard === card) return;
            expandCard(card);
        });
    });

    function handleViewportChange() {
        if (activeCard && isMobileExpand !== isMobile()) {
            collapseCard();
        }

        if (isMobile()) {
            if (!activeCard) {
                layoutTabsAnimated();   // было: layoutTabs();
            } else {
                const panel = getMobilePanelRect();
                applyMobilePanelPosition(activeCard, panel, activeCard.dataset.side);
            }
        } else if (!activeCard) {
            // При переходе mobile -> desktop без раскрытой карточки
            // нужно почистить инлайн-стили, оставшиеся от layoutTabs(),
            // иначе десктопная раскладка (иконки в сетке) не вернётся.
            resetDesktopLayout();
        } else {
            const target = getDesktopTargetRect();
            activeInner.style.left = target.left + 'px';
            activeInner.style.top = target.top + 'px';
            activeInner.style.width = target.width + 'px';
            activeInner.style.height = target.height + 'px';
        }
    }

    window.addEventListener('resize', handleViewportChange);

    // Двойной requestAnimationFrame — стандартный приём, чтобы
    // заставить браузер проиграть CSS-transition после изменения
    // стилей внутри обработчика resize/orientationchange.
    // Если применить новые left/top сразу же (синхронно в этом же
    // обработчике), браузер, уже выполнивший layout из-за самого
    // события ориентации, воспринимает новые координаты как
    // НАЧАЛЬНОЕ состояние элемента, а не как переход от старого —
    // и transition просто не запускается (виден мгновенный скачок).
    // Первый rAF дожидается, пока браузер закоммитит текущий (ещё
    // старый) кадр, второй — уже в следующем кадре — применяет
    // новые стили, и вот тогда transition честно анимирует переход.
    function runViewportChangeAnimated() {
        requestAnimationFrame(() => {
            requestAnimationFrame(handleViewportChange);
        });
    }

    function scheduleViewportRecalc() {
        runViewportChangeAnimated();

        // подстраховочные пересчёты (см. комментарий выше по коду) —
        // на случай запаздывающих значений innerWidth/innerHeight на
        // некоторых мобильных браузерах при повороте
        [150, 350, 600].forEach(delay => {
            setTimeout(runViewportChangeAnimated, delay);
        });
    }

    window.addEventListener('resize', runViewportChangeAnimated);

    if (landscapeMql.addEventListener) {
        landscapeMql.addEventListener('change', scheduleViewportRecalc);
    } else if (landscapeMql.addListener) {
        landscapeMql.addListener(scheduleViewportRecalc);
    }

    window.addEventListener('orientationchange', scheduleViewportRecalc);

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', runViewportChangeAnimated);
    }

    layoutTabs();

})();