/* ==========================================================================
   PHENOM STORE - LÓGICA DE APLICACIÓN Y NAVEGACIÓN (app.js)
   ========================================================================== */

// --- UTILIDAD: CONVERTIR HEX A RGBA ---
function hexToRgba(hex, alpha) {
    if (!hex || hex.length < 7) return `rgba(0, 0, 0, ${alpha})`;
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// --- SISTEMA NAVEGACIÓN SPA ---
function showHomePage() {
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active-view'));
    const homeView = document.getElementById('view-home');
    if (homeView) homeView.classList.add('active-view');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const navLinks = document.getElementById('main-nav-links');
    if (navLinks) navLinks.classList.remove('mobile-active');
}

function navigateToCategory(categoryName) {
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active-view'));
    const catalogView = document.getElementById('view-catalog');
    if (catalogView) catalogView.classList.add('active-view');

    const bgSelect = document.getElementById('bg-target-screen');
    if (bgSelect && bgSelect.querySelector(`option[value="${categoryName}"]`)) {
        bgSelect.value = categoryName;
    }

    const btnAddProd = document.getElementById('btn-dynamic-add-prod');
    if (btnAddProd) btnAddProd.innerText = `+ Agregar Producto`;

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

function bindHeaderNavEvents() {
    const navLinks = document.querySelectorAll('#main-nav-links a');
    navLinks.forEach(a => {
        const categoryText = a.innerText.trim();
        a.onclick = (e) => {
            e.preventDefault();
            navigateToCategory(categoryText);
        };
    });
    if (typeof syncDropdownWithRealTabs === 'function') syncDropdownWithRealTabs();
}

// --- CARRUSEL HORIZONTAL ---
function scrollCarousel(dir) {
    const track = document.getElementById('carousel-track-container');
    if (track) {
        track.scrollBy({ left: dir * 300, behavior: 'smooth' });
    }
}

// --- BÚSQUEDA EN EL CATÁLOGO ---
function filterCatalogSearch(query) {
    const catalogView = document.getElementById('view-catalog');
    if (catalogView && !catalogView.classList.contains('active-view')) {
        navigateToCategory('Todos');
    }
    if (typeof renderCatalogGrid === 'function') {
        renderCatalogGrid(query);
    }
}

// --- ESTILIZADO DINÁMICO DESDE PANEL OMEGA ---
function applyTopBarSettings() {
    const barWrapper = document.getElementById('top-bar-wrapper');
    const textElem = document.getElementById('fub-bar');
    const inputTxt = document.getElementById('edit-fub-bar');
    const inputBgC = document.getElementById('tb-bg-color');
    const inputOp = document.getElementById('tb-opacity');
    const inputBW = document.getElementById('tb-border-w');
    const inputBC = document.getElementById('tb-border-c');
    const inputBR = document.getElementById('tb-border-r');

    if (!textElem) return;

    if (inputTxt) textElem.innerText = inputTxt.value;
    if (barWrapper && inputBgC && inputOp) {
        barWrapper.style.backgroundColor = hexToRgba(inputBgC.value, inputOp.value);
    }
    if (barWrapper && inputBW && inputBC) {
        barWrapper.style.borderBottom = `${inputBW.value}px solid ${inputBC.value}`;
    }
    if (barWrapper && inputBR) {
        barWrapper.style.borderBottomLeftRadius = `${inputBR.value}px`;
        barWrapper.style.borderBottomRightRadius = `${inputBR.value}px`;
    }
}

function applyNavSettings() {
    const header = document.getElementById('main-header');
    const linksContainer = document.querySelector('.nav-links');
    const links = document.querySelectorAll('#main-nav-links a');
    const icons = document.querySelectorAll('.header-controls .icon');
    const burger = document.querySelector('.hamburger');

    const inputBgC = document.getElementById('nav-bg-color');
    const inputTxC = document.getElementById('nav-text-color');
    const inputFont = document.getElementById('nav-font');
    const inputFSize = document.getElementById('nav-font-size');
    const inputGap = document.getElementById('nav-gap');
    const inputPadV = document.getElementById('header-padding-v');

    if (header && inputBgC) header.style.backgroundColor = inputBgC.value;
    if (header && inputPadV) {
        header.style.paddingTop = inputPadV.value + 'px';
        header.style.paddingBottom = inputPadV.value + 'px';
    }
    if (linksContainer && inputGap) linksContainer.style.gap = inputGap.value + 'px';

    if (inputTxC) {
        links.forEach(a => {
            a.style.color = inputTxC.value;
            if (inputFont) a.style.fontFamily = inputFont.value;
            if (inputFSize) a.style.fontSize = inputFSize.value + 'px';
        });
        icons.forEach(i => i.style.color = inputTxC.value);
        if (burger) burger.style.color = inputTxC.value;
    }
}

function applyLogoTextSettings() {
    const logo = document.getElementById('logo-trigger');
    const txtElem = document.getElementById('logo-adj-text-val');
    const inputW = document.getElementById('logo-width');
    const inputT = document.getElementById('logo-adj-text-input');
    const inputF = document.getElementById('logo-adj-font');
    const inputC = document.getElementById('logo-adj-color');
    const inputS = document.getElementById('logo-adj-spacing');

    if (logo && inputW && inputW.value) {
        logo.style.width = inputW.value + 'px';
        logo.style.height = 'auto';
    }
    if (txtElem) {
        if (inputT) txtElem.innerText = inputT.value;
        if (inputF) txtElem.style.fontFamily = inputF.value;
        if (inputC) txtElem.style.color = inputC.value;
        if (inputS) txtElem.style.letterSpacing = inputS.value + 'px';
        if (typeof logoTextFormat !== 'undefined') {
            txtElem.style.fontWeight = logoTextFormat.bold ? 'bold' : 'normal';
            txtElem.style.fontStyle = logoTextFormat.italic ? 'italic' : 'normal';
            txtElem.style.textDecoration = logoTextFormat.underline ? 'underline' : 'none';
        }
    }
}
