// ===== FOOTER ACCORDION MOBILE  =====
(() => {
  const footer = document.getElementById('footer');
  if (!footer) return;

  const MOBILE_BP = 1024;

  function isMobile() {
    return window.innerWidth <= MOBILE_BP;
  }

  function setAria(titleEl, contentEl, open) {
    titleEl.setAttribute('role', 'button');
    titleEl.setAttribute('tabindex', '0');
    titleEl.setAttribute('aria-expanded', open ? 'true' : 'false');
    contentEl.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function initAccordion() {
    const contents = footer.querySelectorAll('.footer__column-content');
    contents.forEach((content, i) => {
      const title = content.previousElementSibling;
      if (!title) return;

      if (!content.id) content.id = `footer-section-${i}`;
      title.setAttribute('aria-controls', content.id);

      const open = !isMobile(); // desktop: aperto
      content.style.display = open ? 'block' : 'none';
      title.classList.toggle('active', open);
      setAria(title, content, open);
    });
  }

  footer.addEventListener('click', (e) => {
    if (!isMobile()) return;
    const title = e.target.closest('.footer__menu-title, .footer__contact-title');
    if (!title) return;

    e.preventDefault();
    const content = title.nextElementSibling;
    if (!content || !content.classList.contains('footer__column-content')) return;

    const isOpen = content.style.display === 'block';

    // chiudi tutto
    footer.querySelectorAll('.footer__column-content').forEach((c) => {
      c.style.display = 'none';
      setAria(c.previousElementSibling, c, false);
      c.previousElementSibling.classList.remove('active');
    });

    // apri quello cliccato (se era chiuso)
    if (!isOpen) {
      content.style.display = 'block';
      setAria(title, content, true);
      title.classList.add('active');
    }
  });

  // supporto tastiera (Enter/Space)
  footer.addEventListener('keydown', (e) => {
    if (!isMobile()) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;

    const title = e.target.closest('.footer__menu-title, .footer__contact-title');
    if (!title) return;

    e.preventDefault();
    title.click();
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
            target.setAttribute('aria-hidden', 'false');
            opener.setAttribute('aria-expanded', 'true');

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
            target.setAttribute('aria-hidden', 'true');
            const openerBtn = document.querySelector(`[data-design-open="${targetId}"]`);
            if (openerBtn) openerBtn.setAttribute('aria-expanded', 'false');

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
                accountMenu.setAttribute('aria-hidden', 'true');
                if (accountButton) accountButton.setAttribute('aria-expanded', 'false');

            }
        }
    });
    
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            const accountMenu = document.getElementById('account');
            if (accountMenu && accountMenu.classList.contains('design-isopen')) {
                accountMenu.classList.remove('design-isopen');
                accountMenu.setAttribute('aria-hidden', 'true');
                const openerBtn = document.querySelector('[data-design-open="account"]');
                if (openerBtn) openerBtn.setAttribute('aria-expanded', 'false');
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

(function() {
  "use strict";

  /*** CONFIG: lingua -> URL di destinazione ***/
  const LANG_URL = {
    it: "https://shop.puntoluce.net/",
    en: "https://shop.puntoluce.net/en/",
    es: "https://shop.puntoluce.net/es/",
    fr: "https://shop.puntoluce.net/fr/",
  };

  /*** ELEMENTI ***/
  const languageSelector = document.getElementById("languageSelector"); // trigger desktop
  const languageDropdown = document.getElementById("languageDropdown"); // menu desktop
  const currentFlag      = document.getElementById("currentFlag");      // bandierina visibile
  const desktopOptions   = document.querySelectorAll(".language-option");
  const mobileOptions    = document.querySelectorAll(".mobile-language-option");

  if (languageSelector) {
    languageSelector.setAttribute("role", "button");
    languageSelector.setAttribute("tabindex", "0");
    languageSelector.setAttribute("aria-haspopup", "true");
    languageSelector.setAttribute("aria-expanded", "false");
    languageSelector.setAttribute("aria-controls", "languageDropdown");
  }
  if (languageDropdown) {
    languageDropdown.setAttribute("role", "menu");
  }
  desktopOptions.forEach(o => o.setAttribute("role", "menuitem"));
  desktopOptions.forEach(o => o.setAttribute("tabindex", "0"));
  if (languageDropdown) languageDropdown.setAttribute("aria-hidden", "true");


  /*** UTILS ***/
  function getLangFromLocation() {
    // Prova a dedurre la lingua dall'URL corrente
    try {
      const p = location.pathname.toLowerCase();
      if (p.startsWith("/en/") || p === "/en") return "en";
      if (p.startsWith("/es/") || p === "/es") return "es";
      if (p.startsWith("/fr/") || p === "/fr") return "fr";
    } catch(_) {}
    return "it";
  }

  function setCurrentFlagAndLabel(lang) {
    try {
      if (currentFlag) {
        currentFlag.src = `./img/flags/${lang}.png`;
        currentFlag.alt = lang.toUpperCase();
      }
      // Aggiorna la label accanto alla bandiera (se esiste)
      const label = languageSelector?.querySelector('[data-i18n="language"]') || languageSelector?.querySelector("span:not(.material-symbols-outlined)");
      if (label) {
        const map = { it: "Italiano", en: "English", es: "Español", fr: "Français" };
        label.textContent = map[lang] || "Italiano";
      }
    } catch(_) {}
  }

    function openDropdown() {
    if (!languageDropdown || !languageSelector) return;
    languageDropdown.classList.add("active");
    languageSelector.setAttribute("aria-expanded", "true");
    languageDropdown.setAttribute("aria-hidden", "false");
    }
    function closeDropdown() {
    if (!languageDropdown || !languageSelector) return;
    languageDropdown.classList.remove("active");
    languageSelector.setAttribute("aria-expanded", "false");
    languageDropdown.setAttribute("aria-hidden", "true");
    }

  function toggleDropdown() {
    if (!languageDropdown) return;
    const isOpen = languageDropdown.classList.contains("active");
    isOpen ? closeDropdown() : openDropdown();
  }

  function go(lang, newTab) {
    const url = LANG_URL[lang] || LANG_URL.it;
    try { localStorage.setItem("selectedLanguage", lang); } catch(_) {}
    if (newTab) {
      window.open(url, "_blank", "noopener");
    } else {
      window.location.href = url;
    }
  }

  /*** INIZIALIZZA STATO CORRENTE (bandiera/label) ***/
  (function initCurrent() {
    let lang = "it";
    try {
      lang = (localStorage.getItem("selectedLanguage") || document.documentElement.lang || getLangFromLocation() || "it").toLowerCase();
    } catch(_) {
      lang = document.documentElement.lang?.toLowerCase() || getLangFromLocation() || "it";
    }
    setCurrentFlagAndLabel(lang);
  })();

  /*** LISTENERS – DESKTOP ***/
  if (languageSelector) {
    // Click sul trigger
    languageSelector.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleDropdown();
    });

    // Tastiera: Enter/Space aprono, Esc chiude
    languageSelector.addEventListener("keydown", (e) => {
      const key = e.key?.toLowerCase();
      if (key === "enter" || key === " ") {
        e.preventDefault();
        toggleDropdown();
      } else if (key === "escape") {
        closeDropdown();
      }
    });
  }

  // Click fuori: chiudi
  document.addEventListener("click", (e) => {
    if (!languageDropdown) return;
    if (languageDropdown.classList.contains("active")) {
      const insideSelector = !!e.target.closest("#languageSelector");
      const insideMenu = !!e.target.closest("#languageDropdown");
      if (!insideSelector && !insideMenu) closeDropdown();
    }
  });

  // Esc globale: chiudi
  document.addEventListener("keydown", (e) => {
    if (e.key?.toLowerCase() === "escape") closeDropdown();
  });

  // Click sulle opzioni desktop (con supporto ctrl/cmd per nuova scheda)
  desktopOptions.forEach(opt => {
    opt.addEventListener("click", (e) => {
      e.stopPropagation();
      const lang = opt.getAttribute("data-lang");
      const newTab = e.metaKey || e.ctrlKey || e.button === 1;
      go(lang, newTab);
      closeDropdown();
    });
    // Middle click (mouse wheel) su desktop options
    opt.addEventListener("auxclick", (e) => {
      if (e.button === 1) {
        e.preventDefault();
        const lang = opt.getAttribute("data-lang");
        go(lang, true);
        closeDropdown();
      }
    });
  });
  desktopOptions.forEach(opt => {
  opt.addEventListener("keydown", (e) => {
    const k = e.key?.toLowerCase();
    if (k === "enter" || k === " ") {
      e.preventDefault();
      const lang = opt.getAttribute("data-lang");
      go(lang, false);
      closeDropdown();
    }
  });
});

  /*** LISTENERS – MOBILE ***/
  mobileOptions.forEach(opt => {
    opt.addEventListener("click", (e) => {
      e.stopPropagation();
      const lang = opt.getAttribute("data-lang");
      go(lang, false);
    });
  });

})();