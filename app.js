/* ==========================================================================
   PHENOM STORE - LÓGICA GENERAL Y NAVEGACIÓN (app.js)
   ========================================================================== */

function hexToRgba(hex, alpha) {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// --- NAVEGACIÓN ENTRE VISTAS (SPA) ---
function showHomePage() {
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active-view'));
    document.getElementById('view-home').classList.add('active-view');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const navLinks = document.getElementById('main-nav-links');
    if (navLinks) navLinks.classList.remove('mobile-active');
}

function navigateToCategory(categoryName) {
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active-view'));
    document.getElementById('view-catalog').classList.add('active-view');
    
    const bgSelect = document.getElementById('bg-target-screen');
    if (bgSelect && bgSelect.querySelector(`option[value="${categoryName}"]`)) {
        bgSelect.value = categoryName;
    }
    
    if (typeof loadScreenBgSettings === 'function') loadScreenBgSettings();
    if (typeof renderCatalogGrid === 'function') renderCatalogGrid(categoryName);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const navLinks = document.getElementById('main-nav-links');
    if (navLinks) navLinks.classList.remove('mobile-active');
}

function toggleMobileMenu() {
    const navLinks = document.getElementById('main-nav-links');
    if (navLinks) navLinks.classList.toggle('mobile-active');
}

// --- VINCULAR EVENTOS DEL MENÚ DE NAVEGACIÓN ---
function bindHeaderNavEvents() {
    const navLinks = document.querySelectorAll('#main-nav-links a');
    navLinks.forEach(a => {
        const categoryText = a.innerText.trim();
        a.onclick = (e) => {
            e.preventDefault();
            navigateToCategory(categoryText);
        };
    });
    if (typeof syncDropdownWithRealTabs === 'function') {
        syncDropdownWithRealTabs();
    }
}

// --- FILTRAR BÚSQUEDA EN TIEMPO REAL ---
function filterCatalogSearch(query) {
    const catalogView = document.getElementById('view-catalog');
    if (catalogView && !catalogView.classList.contains('active-view')) {
        navigateToCategory('Todos');
    }
    if (typeof renderCatalogGrid === 'function') {
        renderCatalogGrid(query);
    }
}

// --- APLICAR ESTILOS DE BARRA SUPERIOR ---
function applyTopBarSettings() {
    const barWrapper = document.getElementById('top-bar-wrapper');
    const textElem = document.getElementById('fub-bar');
    const inputBar = document.getElementById('edit-fub-bar');
    if (!barWrapper || !textElem || !inputBar) return;

    const txt = inputBar.value;
    const bgC = document.getElementById('tb-bg-color')?.value || '#000000';
    const op = document.getElementById('tb-opacity')?.value || '1';
    const bW = document.getElementById('tb-border-w')?.value || '0';
    const bC = document.getElementById('tb-border-c')?.value || '#ca8a04';
    const bR = document.getElementById('tb-border-r')?.value || '0';

    textElem.innerText = txt;
    barWrapper.style.backgroundColor = hexToRgba(bgC, op);
    barWrapper.style.borderBottom = `${bW}px solid ${bC}`;
    barWrapper.style.borderBottomLeftRadius = `${bR}px`;
    barWrapper.style.borderBottomRightRadius = `${bR}px`;
    textElem.style.backgroundColor = "transparent";
}

// --- APLICAR ESTILOS DE BARRA DE NAVEGACIÓN ---
function applyNavSettings() {
    const header = document.getElementById('main-header');
    const linksContainer = document.querySelector('.nav-links');
    const links = document.querySelectorAll('#main-nav-links a');
    const icons = document.querySelectorAll('.header-controls .icon');
    const burger = document.querySelector('.hamburger');
    
    if (!header || !linksContainer) return;

    const bgC = document.getElementById('nav-bg-color')?.value || '#ffffff';
    const txC = document.getElementById('nav-text-color')?.value || '#000000';
    const font = document.getElementById('nav-font')?.value || "'Segoe UI', sans-serif";
    const fSize = document.getElementById('nav-font-size')?.value || '13';
    const nGap = document.getElementById('nav-gap')?.value || '25';
    const hPadV = document.getElementById('header-padding-v')?.value || '15';

    header.style.backgroundColor = bgC;
    header.style.paddingTop = hPadV + 'px';
    header.style.paddingBottom = hPadV + 'px';
    linksContainer.style.gap = nGap + 'px';

    links.forEach(a => {
        a.style.color = txC;
        a.style.fontFamily = font;
        a.style.fontSize = fSize + 'px';
    });
    icons.forEach(i => i.style.color = txC);
    if (burger) burger.style.color = txC;
}

// --- APLICAR ESTILOS DE TEXTO ADYACENTE AL LOGO ---
function applyLogoTextSettings() {
    const logo = document.getElementById('logo-trigger');
    const txtElem = document.getElementById('logo-adj-text-val');
    if (!logo || !txtElem) return;

    const w = document.getElementById('logo-width')?.value || '170';
    const t = document.getElementById('logo-adj-text-input')?.value || '';
    const f = document.getElementById('logo-adj-font')?.value || "'Impact', sans-serif";
    const c = document.getElementById('logo-adj-color')?.value || '#000000';
    const s = document.getElementById('logo-adj-spacing')?.value || '0';

    logo.style.width = w + 'px';
    logo.style.height = 'auto';
    txtElem.innerText = t;
    txtElem.style.fontFamily = f;
    txtElem.style.color = c;
    txtElem.style.letterSpacing = s + 'px';
    
    if (typeof logoTextFormat !== 'undefined') {
        txtElem.style.fontWeight = logoTextFormat.bold ? 'bold' : 'normal';
        txtElem.style.fontStyle = logoTextFormat.italic ? 'italic' : 'normal';
        txtElem.style.textDecoration = logoTextFormat.underline ? 'underline' : 'none';
    }
}