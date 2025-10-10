// ===== FOOTER ACCORDION MOBILE =====
(function() {
    const footer = document.getElementById('footer');
    if (!footer) return;
    
    const MOBILE_BP = 1024;
    
    function isMobile() { 
        return window.innerWidth <= MOBILE_BP; 
    }
    
    function initAccordion() {
        const contents = footer.querySelectorAll('.footer__column-content');
        contents.forEach(content => {
            content.style.display = isMobile() ? 'none' : 'block';
        });
    }
    
    footer.addEventListener('click', e => {
        if (!isMobile()) return;
        
        const title = e.target.closest('.footer__menu-title, .footer__contact-title');
        if (!title) return;
        
        e.preventDefault();
        
        const content = title.nextElementSibling;
        if (!content || !content.classList.contains('footer__column-content')) return;
        
        const isOpen = content.style.display === 'block';
        
        footer.querySelectorAll('.footer__column-content').forEach(c => c.style.display = 'none');
        footer.querySelectorAll('.footer__menu-title, .footer__contact-title').forEach(t => t.classList.remove('active'));
        
        if (!isOpen) {
            content.style.display = 'block';
            title.classList.add('active');
        }
    });
    
    window.addEventListener('resize', () => setTimeout(initAccordion, 200));
    initAccordion();
})();

// ===== MENU REPARTI DESKTOP =====
(function () {
    if (window.innerWidth < 1024) return;

    const deptsList = document.querySelector(".departments-list");
    const subsContainer = document.querySelector(".subdepartments-container");
    if (!deptsList || !subsContainer) return;

    function normalizeData(json) {
        return Array.isArray(json) ? json : (json?.departments || []);
    }

    function renderDepartments(departments) {
        if (!departments?.length) return;

        deptsList.innerHTML = "";
        subsContainer.innerHTML = "";

        departments.forEach((dept, index) => {
            const deptDiv = document.createElement("div");
            deptDiv.className = "department-item";
            deptDiv.textContent = dept.name;
            deptDiv.dataset.index = index;
            if (index === 0) deptDiv.classList.add("active");
            deptsList.appendChild(deptDiv);

            const subsDiv = document.createElement("div");
            subsDiv.className = "subdepartments-list";
            subsDiv.dataset.index = index;
            if (index === 0) subsDiv.classList.add("active");

            if (dept.subdepartments?.length) {
                dept.subdepartments.forEach(sub => {
                    const subDiv = document.createElement("div");
                    subDiv.className = "subdepartment-item";
                    const link = document.createElement("a");
                    link.href = sub.url;
                    link.textContent = sub.name;
                    subDiv.appendChild(link);
                    subsDiv.appendChild(subDiv);
                });
            } else {
                const emptyDiv = document.createElement("div");
                emptyDiv.style.padding = "20px";
                emptyDiv.style.color = "#999";
                emptyDiv.textContent = "Nessuna sottocategoria";
                subsDiv.appendChild(emptyDiv);
            }

            subsContainer.appendChild(subsDiv);
        });

        deptsList.addEventListener("mouseover", e => {
            const item = e.target.closest(".department-item");
            if (!item) return;

            deptsList.querySelectorAll(".department-item").forEach(d => d.classList.remove("active"));
            subsContainer.querySelectorAll(".subdepartments-list").forEach(s => s.classList.remove("active"));

            item.classList.add("active");
            const targetSubs = subsContainer.querySelector(`.subdepartments-list[data-index="${item.dataset.index}"]`);
            if (targetSubs) targetSubs.classList.add("active");
        });
    }

    async function loadDepartments() {
        try {
            const res = await fetch("./departments.json?v=" + Date.now(), { cache: "no-store" });
            if (!res.ok) throw new Error("HTTP " + res.status);
            const json = await res.json();
            const data = normalizeData(json);
            if (data.length) return data;
        } catch (err) {
            console.warn("[departments] fetch fallito:", err);
        }

        const alt = [];
        const menuDepts = document.querySelectorAll(".header__navigation-department");
        if (menuDepts.length > 0) {
            menuDepts.forEach(dept => {
                const id = dept.getAttribute("data-department-id");
                const name = dept.querySelector(".header__navigation-submenu-list-title")?.textContent.trim();
                const subContainer = document.querySelector(`.header__navigation-subcategory-container[data-department-id="${id}"]`);
                const subdepartments = [];
                if (subContainer) {
                    subContainer.querySelectorAll(".header__navigation-submenu-item a").forEach(link => {
                        subdepartments.push({ name: link.textContent.trim(), url: link.href });
                    });
                }
                alt.push({ id, name, subdepartments });
            });
        }
        return alt;
    }

    (async function init() {
        const departments = await loadDepartments();
        if (!departments?.length) {
            console.warn("[departments] Nessun reparto disponibile.");
            return;
        }
        renderDepartments(departments);
    })();
})();

// ===== HAMBURGER MENU MOBILE =====
(function () {
    const SIDE_BTN = document.querySelector('.header__side-menu');
    const MENU = document.getElementById('mobile-menu');
    if (!SIDE_BTN || !MENU) return;

    const PANEL = MENU.querySelector('.mobile-menu__panel');
    const OVERLAY = MENU.querySelector('[data-close]');
    const CLOSES = MENU.querySelectorAll('[data-close]');
    const LIST = document.getElementById('mobile-departments-list');
    const MORE = document.getElementById('mobile-departments-more');

    const SHORT_COUNT = 8;
    let fullOpen = false;
    let departmentsCache = null;

    function openMenu() {
        MENU.classList.add('is-open');
        MENU.setAttribute('aria-hidden','false');
        document.body.classList.add('no-scroll');
        setTimeout(() => PANEL.querySelector('.mobile-menu__close')?.focus(), 0);
        document.addEventListener('keydown', onKeyDown);
    }
    
    function closeMenu() {
        MENU.classList.remove('is-open');
        MENU.setAttribute('aria-hidden','true');
        document.body.classList.remove('no-scroll');
        document.removeEventListener('keydown', onKeyDown);
        SIDE_BTN.focus();
    }
    
    function onKeyDown(e) {
        if (e.key === 'Escape') closeMenu();
    }

    SIDE_BTN.addEventListener('click', openMenu);
    OVERLAY?.addEventListener('click', closeMenu);
    CLOSES.forEach(btn => btn.addEventListener('click', closeMenu));

    async function loadDepartments() {
        if (departmentsCache) return departmentsCache;
        
        const candidates = ['departments.json', './departments.json', '/departments.json'];
        for (const p of candidates) {
            try {
                const url = new URL(p, document.baseURI);
                url.searchParams.set('v', Date.now());
                const res = await fetch(url, { cache: 'no-store' });
                if (!res.ok) continue;
                const json = await res.json();
                const arr = Array.isArray(json) ? json : (Array.isArray(json?.departments) ? json.departments : []);
                if (arr.length) { 
                    departmentsCache = arr; 
                    return arr; 
                }
            } catch (_) {}
        }
        
        const alt = [];
        document.querySelectorAll(".header__navigation-department").forEach(dept => {
            const id = dept.getAttribute("data-department-id");
            const name = dept.querySelector(".header__navigation-submenu-list-title")?.textContent.trim();
            const sub = document.querySelector(`.header__navigation-subcategory-container[data-department-id="${id}"]`);
            const subs = [];
            sub?.querySelectorAll(".header__navigation-submenu-item a").forEach(a => subs.push({ name: a.textContent.trim(), url: a.href }));
            alt.push({ id, name, subdepartments: subs });
        });
        departmentsCache = alt;
        return alt;
    }

    function renderDepartments(departments) {
        LIST.innerHTML = '';
        const slice = fullOpen ? departments : departments.slice(0, SHORT_COUNT);

        slice.forEach(dept => {
            const li = document.createElement('li');
            li.className = 'mobile-menu__item';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'mobile-menu__button';
            btn.setAttribute('aria-expanded', 'false');
            btn.innerHTML = `<span>${dept.name}</span><span class="material-symbols-outlined mobile-menu__chevron">chevron_right</span>`;

            const sub = document.createElement('ul');
            sub.className = 'mobile-sublist';
            
            if (dept.subdepartments?.length) {
                dept.subdepartments.forEach(sd => {
                    const sli = document.createElement('li');
                    sli.className = 'mobile-subitem';
                    const a = document.createElement('a');
                    a.href = sd.url;
                    a.textContent = sd.name;
                    sli.appendChild(a);
                    sub.appendChild(sli);
                });
            } else {
                const empty = document.createElement('li');
                empty.className = 'mobile-subitem';
                empty.innerHTML = `<span style="display:block;padding:8px 12px;color:#777">Nessuna sottocategoria</span>`;
                sub.appendChild(empty);
            }

            btn.addEventListener('click', function () {
                const open = sub.classList.toggle('is-open');
                btn.setAttribute('aria-expanded', open ? 'true' : 'false');
                btn.querySelector('.mobile-menu__chevron').textContent = open ? 'expand_more' : 'chevron_right';
            });

            li.appendChild(btn);
            li.appendChild(sub);
            LIST.appendChild(li);
        });

        if (!fullOpen && departments.length > SHORT_COUNT) {
            MORE.style.display = 'flex';
            MORE.querySelector('.material-symbols-outlined').textContent = 'add';
            MORE.lastChild.nodeType === 3 ? (MORE.lastChild.textContent = ' Mostra tutti i reparti') : null;
        } else if (fullOpen && departments.length > SHORT_COUNT) {
            MORE.style.display = 'flex';
            MORE.querySelector('.material-symbols-outlined').textContent = 'remove';
            MORE.lastChild.nodeType === 3 ? (MORE.lastChild.textContent = ' Mostra meno reparti') : null;
        } else {
            MORE.style.display = 'none';
        }
    }

    MORE.addEventListener('click', function () {
        fullOpen = !fullOpen;
        if (departmentsCache) renderDepartments(departmentsCache);
    });

    let hydrated = false;
    SIDE_BTN.addEventListener('click', async function hydrateOnce() {
        if (hydrated) return;
        const depts = await loadDepartments();
        renderDepartments(depts);
        hydrated = true;
    }, { once: true });
})();

// ===== MENU ACCOUNT =====
(function() {
    document.addEventListener('click', e => {
        const opener = e.target.closest('[data-design-open]');
        if (!opener) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const targetId = opener.getAttribute('data-design-open');
        const target = document.getElementById(targetId);
        
        if (target && !target.classList.contains('design-isopen')) {
            target.classList.add('design-isopen');
            if (window.innerWidth < 1024) {
                document.body.classList.add('no-scroll');
            }
        }
    });
    
    document.addEventListener('click', e => {
        const closer = e.target.closest('[data-design-close]');
        if (!closer) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const targetId = closer.getAttribute('data-design-close');
        const target = document.getElementById(targetId);
        
        if (target) {
            target.classList.remove('design-isopen');
            document.body.classList.remove('no-scroll');
        }
    });
    
    document.addEventListener('click', e => {
        if (window.innerWidth < 1024) return;
        
        const accountMenu = document.getElementById('account');
        const accountButton = document.querySelector('[data-design-open="account"]');
        
        if (accountMenu && accountMenu.classList.contains('design-isopen')) {
            if (!accountMenu.contains(e.target) && 
                (!accountButton || !accountButton.contains(e.target))) {
                accountMenu.classList.remove('design-isopen');
            }
        }
    });
    
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            const accountMenu = document.getElementById('account');
            if (accountMenu && accountMenu.classList.contains('design-isopen')) {
                accountMenu.classList.remove('design-isopen');
                document.body.classList.remove('no-scroll');
            }
        }
    });
})();

// ===== NAVIGATION HIDE ON SCROLL =====
(function () {
    const nav = document.querySelector('.header__navigation');
    if (!nav) return;

    const THRESHOLD = 170;
    const HYSTERESIS = 24;
    let lastY = window.scrollY || 0;
    let hidden = false;
    let ticking = false;

    function showNav() {
        if (hidden) {
            nav.classList.remove('header__navigation--hidden');
            hidden = false;
        }
    }
    
    function hideNav() {
        if (!hidden) {
            nav.classList.add('header__navigation--hidden');
            hidden = true;
            nav.querySelector(':focus-visible')?.blur?.();
        }
    }

    function onScroll() {
        if (window.innerWidth < 1024) { 
            showNav(); 
            lastY = window.scrollY; 
            ticking = false; 
            return; 
        }

        const y = window.scrollY || document.documentElement.scrollTop || 0;
        const scrollingDown = y > lastY;
        const overlayOpen = document.body.classList.contains('no-scroll');

        if (y <= 10) {
            showNav();
        } else if (!overlayOpen) {
            if (scrollingDown && y > THRESHOLD + HYSTERESIS) {
                hideNav();
            } else if (!scrollingDown) {
                showNav();
            }
        }

        lastY = y;
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(onScroll);
        }
    }

    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', () => {
        if (window.innerWidth < 1024) showNav();
    });
})();

// ===== PUNTO LUCE EXPAND/COLLAPSE =====
function toggleContent() {
    const contentWrapper = document.getElementById('contentWrapper');
    const expandButton = document.getElementById('expandButton');
    
    if (!contentWrapper || !expandButton) return;
    
    const isExpanded = contentWrapper.classList.contains('expanded');
    
    if (isExpanded) {
        contentWrapper.classList.remove('expanded');
        expandButton.classList.remove('expanded');
        
        setTimeout(() => {
            document.querySelector('.punto-luce-section')?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);
    } else {
        contentWrapper.classList.add('expanded');
        expandButton.classList.add('expanded');
    }
}

window.addEventListener('resize', function() {
    if (window.innerWidth < 768) {
        const contentWrapper = document.getElementById('contentWrapper');
        if (contentWrapper?.classList.contains('expanded')) {
            toggleContent();
        }
    }
});


// ===== LANGUAGE SWITCHER =====
(function() {
    let translations = {};
    let currentLang = localStorage.getItem('selectedLanguage') || 'it';

    const languageSelector = document.getElementById('languageSelector');
    const languageDropdown = document.getElementById('languageDropdown');
    const currentFlag = document.getElementById('currentFlag');
    const languageOptions = document.querySelectorAll('.language-option');
    const mobileLanguageOptions = document.querySelectorAll('.mobile-language-option');

    // Carica le traduzioni
    async function loadTranslations() {
        try {
            const response = await fetch('./translations.json');
            translations = await response.json();
            setLanguage(currentLang);
        } catch (error) {
            console.error('Errore nel caricamento delle traduzioni:', error);
        }
    }

    // Imposta la lingua
    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('selectedLanguage', lang);

        // Aggiorna tutti gli elementi con data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                element.innerHTML = translations[lang][key];
            }
        });

        // Aggiorna la bandiera corrente (desktop)
        if (currentFlag) {
            currentFlag.src = `./img/flags/${lang}.png`;
            currentFlag.alt = lang.toUpperCase();
        }

        // Aggiorna la selezione nel dropdown desktop
        languageOptions.forEach(option => {
            if (option.getAttribute('data-lang') === lang) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });

        // Aggiorna la selezione nel menu mobile
        mobileLanguageOptions.forEach(option => {
            if (option.getAttribute('data-lang') === lang) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });

        // Aggiorna il numero di telefono nel link
        const phoneLink = document.querySelector('a[href^="tel:"]');
        if (phoneLink && translations[lang] && translations[lang].phone) {
            phoneLink.href = `tel:${translations[lang].phone}`;
        }

        // Aggiorna il testo del bottone "Mostra tutti/meno i reparti"
        updateDepartmentsButtonText();
    }

    // Aggiorna il testo del bottone reparti nel mobile menu
    function updateDepartmentsButtonText() {
        const moreButton = document.getElementById('mobile-departments-more');
        if (moreButton) {
            const isExpanded = moreButton.querySelector('.material-symbols-outlined').textContent === 'remove';
            const key = isExpanded ? 'show_less_departments' : 'show_all_departments';
            const textSpan = moreButton.querySelector('[data-i18n]');
            if (textSpan && translations[currentLang] && translations[currentLang][key]) {
                textSpan.textContent = translations[currentLang][key];
            }
        }
    }

    // Toggle dropdown desktop
    if (languageSelector) {
        languageSelector.addEventListener('click', (e) => {
            e.stopPropagation();
            languageDropdown.classList.toggle('active');
        });
    }

    // Selezione lingua desktop
    languageOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const selectedLang = option.getAttribute('data-lang');
            setLanguage(selectedLang);
            languageDropdown.classList.remove('active');
        });
    });

    // Selezione lingua mobile
    mobileLanguageOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const selectedLang = option.getAttribute('data-lang');
            setLanguage(selectedLang);
        });
    });

    // Chiudi dropdown cliccando fuori
    document.addEventListener('click', () => {
        if (languageDropdown) {
            languageDropdown.classList.remove('active');
        }
    });

    // Inizializza
    loadTranslations();
})();