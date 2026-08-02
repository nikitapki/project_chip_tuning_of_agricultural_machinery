(function () {

    /* ==================================================
                    НАСТРОЙКИ
    ================================================== */

    const MOBILE_BREAKPOINT = 1024;

    const MAX_WIDTH  = 900;
    const MAX_HEIGHT = 580;
    const MARGIN     = 24;

    const TAB_WIDTH   = 46;
    const TAB_HEIGHT  = 118;
    const TAB_GAP     = 16;
    const TAB_TOP_MARGIN = 16;

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

        const topStart = getHeaderHeight() + TAB_TOP_MARGIN;
        let leftCount = 0;
        let rightCount = 0;

        cards.forEach((card, i) => {
            if (card.classList.contains('is-expanded')) return;

            const side = i % 2 === 0 ? 'left' : 'right';
            const slot = side === 'left' ? leftCount++ : rightCount++;
            const top = topStart + slot * (TAB_HEIGHT + TAB_GAP);

            card.dataset.side = side;

            card.style.left = side === 'left' ? '0px' : '';
            card.style.right = side === 'right' ? '0px' : '';
            card.style.top = top + 'px';
            card.style.width = TAB_WIDTH + 'px';
            card.style.height = TAB_HEIGHT + 'px';
        });
    }

    // Сброс инлайн-стилей, которые layoutTabs()/expandMobile()
    // проставляют карточкам в мобильном режиме (left/right/top/width/
    // height, data-side). Эти инлайн-стили сильнее любых правил из
    // @media, поэтому при возврате на широкий экран их обязательно
    // нужно чистить вручную — иначе десктопная раскладка (иконки в
    // сетке) не может вернуться на место.
    function resetDesktopLayout() {
        cards.forEach(card => {
            if (card.classList.contains('is-expanded')) return;

            card.style.left = '';
            card.style.right = '';
            card.style.top = '';
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
            width: rect.width,
            height: rect.height
        };

        card.classList.add('is-expanded');
        inner.classList.add('is-expanded');

        const panel = getMobilePanelRect();

        card.style.top = panel.top + 'px';
        card.style.width = panel.width + 'px';
        card.style.height = panel.height + 'px';

        if (side === 'left') {
            card.style.left = '0px';
            card.style.right = '';
        } else {
            card.style.right = '0px';
            card.style.left = '';
        }

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
            card.style.top = home.top + 'px';
            card.style.width = home.width + 'px';
            card.style.height = home.height + 'px';

            if (side === 'left') {
                card.style.left = '0px';
                card.style.right = '';
            } else {
                card.style.right = '0px';
                card.style.left = '';
            }
        }

        function onTransitionEnd(e) {
            if (e.target !== card) return;
            card.removeEventListener('transitionend', onTransitionEnd);

            // после завершения анимации синхронизируем со всеми
            // остальными вкладками — на случай, если пока карточка
            // была открыта, поменялась высота хедера/окна.
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

    window.addEventListener('resize', () => {
        if (activeCard && isMobileExpand !== isMobile()) {
            collapseCard();
        }

        if (isMobile()) {
            if (!activeCard) {
                layoutTabs();
            } else {
                const panel = getMobilePanelRect();

                activeCard.style.top = panel.top + 'px';
                activeCard.style.width = panel.width + 'px';
                activeCard.style.height = panel.height + 'px';
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
    });

    layoutTabs();

})();