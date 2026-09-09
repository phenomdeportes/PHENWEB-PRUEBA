/* ==========================================================================
   PHENOM STORE - LÓGICA DEL PANEL CONTROL OMEGA Y ADMINISTRACIÓN (admin.js)
   ========================================================================== */

let clickCount = 0;
let clickTimer;
let screenSettings = {};
let productsData = [
    {
        id: 'prod-1',
        title: 'Guantes de Boxeo Blanco / Dorado',
        category: 'PROTECTORES',
        variants: ['12oz', '14oz', '16oz'],
        regularPrice: '$2.500',
        price: '$2.090 UYU',
        mpLink: '',
        media: ['https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=400']
    },
    {
        id: 'prod-2',
        title: 'Cabezal Sparring Pro Negro Mate',
        category: 'PROTECTORES',
        variants: ['10oz', '12oz'],
        regularPrice: '',
        price: '$2.350 UYU',
        mpLink: '',
        media: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=400']
    }
];
let featuredProducts = ['prod-1', 'prod-2'];
let logoTextFormat = { bold: false, italic: false, underline: false };

// --- COMPRESIÓN DE IMÁGENES MEDIANTE CANVAS ---
function compressImage(file, maxWidth, maxHeight, quality, callback) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            let canvas = document.createElement('canvas');
            let width = img.width, height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            let ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// --- MODO ADMINISTRADOR (CONTROL OMEGA) ---
function toggleAdminMode(forceState) {
    const adminPanel = document.getElementById('admin-panel');
    if (!adminPanel) return;

    if (forceState) {
        adminPanel.classList.add('active');
        document.body.classList.add('admin-mode', 'panel-active');
        renderHeaderTabsManager();
        syncDropdownWithRealTabs();
        loadScreenBgSettings();
        renderCarouselAdmin();
    } else {
        adminPanel.classList.remove('active');
        document.body.classList.remove('admin-mode', 'panel-active');
    }
}

function initLogoUnlockTrigger() {
    const logoTrigger = document.getElementById('logo-trigger');
    if (!logoTrigger) return;

    logoTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (document.body.classList.contains('admin-mode')) {
            return;
        }

        clickCount++;
        clearTimeout(clickTimer);

        if (clickCount === 5) {
            toggleAdminMode(true);
            clickCount = 0;
        } else {
            clickTimer = setTimeout(() => {
                if (clickCount < 5 && typeof showHomePage === 'function') {
                    showHomePage();
                }
                clickCount = 0;
            }, 1200);
        }
    });
}

// --- RENDERIZAR GRILLA DE CATÁLOGO ---
function renderCatalogGrid(categoryFilter) {
    const container = document.getElementById('catalog-grid-container');
    if (!container) return;

    container.innerHTML = '';

    const filtered = productsData.filter(p =>
        categoryFilter === 'Todos' || categoryFilter === 'SALE' ||
        p.category.toLowerCase().includes(categoryFilter.toLowerCase()) ||
        p.title.toLowerCase().includes(categoryFilter.toLowerCase())
    );

    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.id = p.id;

        let variantsHtml = (p.variants || []).map(v => `<span class="badge-item">${v}</span>`).join('');
        let regPriceHtml = p.regularPrice ? `<span class="regular-price">${p.regularPrice}</span>` : '';
        let mpBtnHtml = p.mpLink ? `<a href="${p.mpLink}" target="_blank" class="btn-mp">💳 Pagar</a>` : '';
        let imgSrc = (p.media && p.media[0]) ? p.media[0] : 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=400';

        card.innerHTML = `
            <div>
                <div class="card-img-wrapper"><img src="${imgSrc}" alt="${p.title}"></div>
                <div class="card-title-text">${p.title}</div>
                <div class="variant-badges">${variantsHtml}</div>
                <div class="price-container">${regPriceHtml} <span class="offer-price">${p.price}</span></div>
            </div>
            <div>
                ${mpBtnHtml}
                <button class="btn-add-cart" onclick="handleAddToCartClick('${p.id}')">Agregar al Carrito</button>
                <div class="admin-card-controls">
                    <button class="btn-admin-edit" onclick="editDarkProduct('${p.id}')">✏️ Editar</button>
                    <button class="btn-admin-delete" onclick="deleteProductById('${p.id}')">🗑️ Eliminar</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    applyBackgroundSettings();
}

// --- CARRUSEL DESTACADOS ---
function renderCarouselAdmin() {
    const container = document.getElementById('admin-carousel-products');
    if (!container) return;

    container.innerHTML = '';
    productsData.forEach(p => {
        const isChecked = featuredProducts.includes(p.id) ? 'checked' : '';
        container.innerHTML += `<label><input type="checkbox" value="${p.id}" class="chk-featured" ${isChecked} onchange="updateFeaturedProducts()"> ${p.title}</label>`;
    });
}

function updateFeaturedProducts() {
    featuredProducts = Array.from(document.querySelectorAll('.chk-featured:checked')).map(c => c.value);
    renderCarouselFront();
    saveAllSettings();
}

function renderCarouselFront() {
    const track = document.getElementById('carousel-track-container');
    if (!track) return;

    track.innerHTML = '';
    featuredProducts.forEach(id => {
        const p = productsData.find(prod => prod.id === id);
        if (p) {
            const card = document.createElement('div');
            card.className = 'product-card carousel-card';
            card.id = 'front-' + p.id;
            let variantsHtml = (p.variants || []).map(v => `<span class="badge-item">${v}</span>`).join('');
            let regPriceHtml = p.regularPrice ? `<span class="regular-price">${p.regularPrice}</span>` : '';
            let mpBtnHtml = p.mpLink ? `<a href="${p.mpLink}" target="_blank" class="btn-mp">💳 Pagar</a>` : '';
            let imgSrc = (p.media && p.media[0]) ? p.media[0] : 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=400';

            card.innerHTML = `
                <div>
                    <div class="card-img-wrapper"><img src="${imgSrc}" alt="${p.title}"></div>
                    <div class="card-title-text">${p.title}</div>
                    <div class="variant-badges">${variantsHtml}</div>
                    <div class="price-container">${regPriceHtml} <span class="offer-price">${p.price}</span></div>
                </div>
                <div>
                    ${mpBtnHtml}
                    <button class="btn-add-cart" onclick="handleAddToCartClick('${p.id}')">Agregar al Carrito</button>
                </div>
            `;
            track.appendChild(card);
        }
    });
}

// --- PESTAÑAS Y FONDOS ---
function syncDropdownWithRealTabs() {
    const navLinks = document.querySelectorAll('#main-nav-links a');
    const bgSelect = document.getElementById('bg-target-screen');
    if (!bgSelect) return;

    const currentSelected = bgSelect.value;
    bgSelect.innerHTML = '';

    navLinks.forEach(a => {
        const name = a.innerText.trim();
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        bgSelect.appendChild(opt);

        if (!screenSettings[name]) {
            screenSettings[name] = { bg: '', fit: 'cover', opacity: '0', bgOverlay: '0', title: name, font: "'Segoe UI', sans-serif", color: '#000000', spacing: 0, bold: false, italic: false, underline: false };
        }
    });

    if (currentSelected && bgSelect.querySelector(`option[value="${currentSelected}"]`)) {
        bgSelect.value = currentSelected;
    }
}

function loadScreenBgSettings() {
    const bgSelect = document.getElementById('bg-target-screen');
    if (!bgSelect || !bgSelect.value) return;

    const screen = bgSelect.value;
    if (!screenSettings[screen]) {
        screenSettings[screen] = { bg: '', fit: 'cover', opacity: '0', bgOverlay: '0', title: screen, font: "'Segoe UI', sans-serif", color: '#000000', spacing: 0, bold: false, italic: false, underline: false };
    }
    const s = screenSettings[screen];

    const inputFit = document.getElementById('bg-fit-mode');
    const inputOp = document.getElementById('card-transparency');
    const inputOverlay = document.getElementById('bg-overlay-alpha');
    const inputTitle = document.getElementById('title-text-input');
    const inputFont = document.getElementById('title-font-family');
    const inputColor = document.getElementById('title-color-input');
    const inputSpacing = document.getElementById('title-letter-spacing');

    if (inputFit) inputFit.value = s.fit || 'cover';
    if (inputOp) inputOp.value = s.opacity || '0';
    if (inputOverlay) inputOverlay.value = s.bgOverlay || '0';
    if (inputTitle) inputTitle.value = s.title || screen;
    if (inputFont) inputFont.value = s.font || "'Segoe UI', sans-serif";
    if (inputColor) inputColor.value = s.color || '#000000';
    if (inputSpacing) inputSpacing.value = s.spacing || 0;

    const btnB = document.getElementById('fmt-b');
    const btnI = document.getElementById('fmt-i');
    const btnS = document.getElementById('fmt-s');

    if (btnB) btnB.classList.toggle('active', !!s.bold);
    if (btnI) btnI.classList.toggle('active', !!s.italic);
    if (btnS) btnS.classList.toggle('active', !!s.underline);

    applyBackgroundSettings();
    applyTitleSettings();
}

function applyBackgroundSettings() {
    const bgSelect = document.getElementById('bg-target-screen');
    if (!bgSelect || !bgSelect.value) return;

    const screen = bgSelect.value;
    const s = screenSettings[screen];

    const inputFit = document.getElementById('bg-fit-mode');
    const inputOp = document.getElementById('card-transparency');
    const inputOverlay = document.getElementById('bg-overlay-alpha');

    if (inputFit) s.fit = inputFit.value;
    if (inputOp) s.opacity = inputOp.value;
    if (inputOverlay) s.bgOverlay = inputOverlay.value;

    const catalogBg = document.getElementById('catalog-main-bg');
    if (catalogBg) {
        if (s.bg) {
            catalogBg.style.backgroundImage = `linear-gradient(rgba(0,0,0,${s.bgOverlay || 0}), rgba(0,0,0,${s.bgOverlay || 0})), url('${s.bg}')`;
            catalogBg.style.backgroundSize = s.fit;
            catalogBg.style.backgroundRepeat = s.fit === 'repeat' ? 'repeat' : 'no-repeat';
        } else {
            catalogBg.style.backgroundImage = 'none';
        }
    }

    document.querySelectorAll('.product-card:not(.carousel-card)').forEach(c => {
        c.style.backgroundColor = `rgba(255, 255, 255, ${1 - parseFloat(s.opacity || 0)})`;
    });
}

function applyTitleSettings() {
    const bgSelect = document.getElementById('bg-target-screen');
    if (!bgSelect || !bgSelect.value) return;

    const screen = bgSelect.value;
    const s = screenSettings[screen];

    const inputTitle = document.getElementById('title-text-input');
    const inputFont = document.getElementById('title-font-family');
    const inputColor = document.getElementById('title-color-input');
    const inputSpacing = document.getElementById('title-letter-spacing');

    if (inputTitle) s.title = inputTitle.value;
    if (inputFont) s.font = inputFont.value;
    if (inputColor) s.color = inputColor.value;
    if (inputSpacing) s.spacing = inputSpacing.value;

    const titleElem = document.getElementById('catalog-category-title');
    if (titleElem) {
        titleElem.innerText = s.title;
        titleElem.style.fontFamily = s.font;
        titleElem.style.color = s.color;
        titleElem.style.letterSpacing = s.spacing + 'px';
        titleElem.style.fontWeight = s.bold ? 'bold' : 'normal';
        titleElem.style.fontStyle = s.italic ? 'italic' : 'normal';
        titleElem.style.textDecoration = s.underline ? 'underline' : 'none';
    }
}

function toggleFormat(type) {
    const bgSelect = document.getElementById('bg-target-screen');
    if (!bgSelect || !bgSelect.value) return;

    const s = screenSettings[bgSelect.value];
    if (type === 'bold') s.bold = !s.bold;
    if (type === 'italic') s.italic = !s.italic;
    if (type === 'underline') s.underline = !s.underline;

    loadScreenBgSettings();
    saveAllSettings();
}

function toggleLogoFormat(type) {
    logoTextFormat[type] = !logoTextFormat[type];
    const btn = document.getElementById('fmt-logo-' + type.charAt(0));
    if (btn) btn.classList.toggle('active', logoTextFormat[type]);

    if (typeof applyLogoTextSettings === 'function') applyLogoTextSettings();
    saveAllSettings();
}

// --- CREAR Y EDITAR PRODUCTO EN MODAL ---
let currentUploadedFiles = [];

function openCreateProductModal() {
    document.getElementById('dark-modal-title-text').innerText = "Cargar Nuevo Producto";
    document.getElementById('dark-prod-id').value = '';
    document.getElementById('dark-title').value = '';
    document.getElementById('dark-reg-price').value = '';
    document.getElementById('dark-price').value = '';
    document.getElementById('dark-mp-link').value = '';
    document.querySelectorAll('.chk-oz').forEach(c => c.checked = false);
    currentUploadedFiles = [];
    renderFilesPreview();
    document.getElementById('dark-product-modal').classList.add('active');
}

function editDarkProduct(id) {
    const p = productsData.find(item => item.id === id);
    if (!p) return;

    document.getElementById('dark-modal-title-text').innerText = "Editar Producto";
    document.getElementById('dark-prod-id').value = p.id;
    document.getElementById('dark-title').value = p.title;
    document.getElementById('dark-reg-price').value = p.regularPrice || '';
    document.getElementById('dark-price').value = p.price;
    document.getElementById('dark-mp-link').value = p.mpLink || '';

    document.querySelectorAll('.chk-oz').forEach(c => {
        c.checked = p.variants && p.variants.includes(c.value);
    });

    currentUploadedFiles = p.media || [];
    renderFilesPreview();
    document.getElementById('dark-product-modal').classList.add('active');
}

function closeDarkModal() {
    document.getElementById('dark-product-modal').classList.remove('active');
}

function handleDarkFiles(input, type) {
    Array.from(input.files).forEach(file => {
        if (file.type.startsWith('image/')) {
            compressImage(file, 600, 600, 0.7, (compressedUrl) => {
                currentUploadedFiles.push(compressedUrl);
                renderFilesPreview();
            });
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentUploadedFiles.push(e.target.result);
                renderFilesPreview();
            };
            reader.readAsDataURL(file);
        }
    });
}

function renderFilesPreview() {
    const box = document.getElementById('files-preview-container');
    if (!box) return;

    if (currentUploadedFiles.length === 0) {
        box.innerText = "Sin archivos seleccionados";
        return;
    }

    box.innerHTML = '';
    currentUploadedFiles.forEach((f, idx) => {
        const thumb = document.createElement('div');
        thumb.className = 'file-thumb';
        thumb.innerHTML = `Archivo #${idx + 1} <span onclick="removeFile(${idx})" style="cursor:pointer; color:#ef4444; font-weight:bold;">✕</span>`;
        box.appendChild(thumb);
    });
}

function removeFile(index) {
    currentUploadedFiles.splice(index, 1);
    renderFilesPreview();
}

function saveDarkProduct() {
    const id = document.getElementById('dark-prod-id').value;
    const title = document.getElementById('dark-title').value || 'Producto Phenom';
    const regPrice = document.getElementById('dark-reg-price').value;
    const price = document.getElementById('dark-price').value || '$0 UYU';
    const mp = document.getElementById('dark-mp-link').value;
    const bgSelect = document.getElementById('bg-target-screen');
    const cat = bgSelect ? bgSelect.value : 'PROTECTORES';

    const selectedOz = [];
    document.querySelectorAll('.chk-oz:checked').forEach(c => selectedOz.push(c.value));

    if (id) {
        const idx = productsData.findIndex(p => p.id === id);
        if (idx !== -1) {
            productsData[idx] = { id, title, category: cat, variants: selectedOz, regularPrice: regPrice, price, mpLink: mp, media: currentUploadedFiles };
        }
    } else {
        productsData.push({
            id: 'prod-' + Date.now(),
            title,
            category: cat,
            variants: selectedOz,
            regularPrice: regPrice,
            price,
            mpLink: mp,
            media: currentUploadedFiles
        });
    }

    closeDarkModal();
    saveAllSettings();
    renderCatalogGrid(cat);
    renderCarouselAdmin();
    renderCarouselFront();
}

function deleteProductById(id) {
    if (confirm("¿Eliminar este producto?")) {
        productsData = productsData.filter(p => p.id !== id);
        featuredProducts = featuredProducts.filter(fid => fid !== id);
        saveAllSettings();
        const bgSelect = document.getElementById('bg-target-screen');
        renderCatalogGrid(bgSelect ? bgSelect.value : 'Todos');
        renderCarouselAdmin();
        renderCarouselFront();
    }
}

// --- GESTIÓN PESTAÑAS Y MODALES SECUNDARIOS ---
function renderHeaderTabsManager() {
    const listContainer = document.getElementById('header-tabs-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    document.querySelectorAll('#main-nav-links a').forEach((a, index) => {
        const item = document.createElement('div');
        item.className = 'header-tab-item';
        item.innerHTML = `<span>${a.innerText}</span> <span>✎</span>`;
        item.onclick = () => openHeaderTabModal(index);
        listContainer.appendChild(item);
    });
}

function openHeaderTabModal(index) {
    const navLinks = document.querySelectorAll('#main-nav-links a');
    if (index >= 0 && index < navLinks.length) {
        document.getElementById('edit-tab-index').value = index;
        document.getElementById('edit-tab-text').value = navLinks[index].innerText;
        document.getElementById('edit-tab-highlight').checked = navLinks[index].classList.contains('highlight');
    }
    document.getElementById('edit-header-tab-modal').classList.add('active');
}

function closeHeaderTabModal() {
    document.getElementById('edit-header-tab-modal').classList.remove('active');
}

function applyHeaderTabChanges() {
    const index = parseInt(document.getElementById('edit-tab-index').value);
    const newText = document.getElementById('edit-tab-text').value;
    const isHighlight = document.getElementById('edit-tab-highlight').checked;
    const navLinks = document.querySelectorAll('#main-nav-links a');

    if (index >= 0 && index < navLinks.length) {
        navLinks[index].innerText = newText;
        if (isHighlight) navLinks[index].classList.add('highlight');
        else navLinks[index].classList.remove('highlight');
    }
    closeHeaderTabModal();
    if (typeof bindHeaderNavEvents === 'function') bindHeaderNavEvents();
    renderHeaderTabsManager();
    saveAllSettings();
}

function addNewHeaderTab() {
    const navLinksContainer = document.getElementById('main-nav-links');
    if (!navLinksContainer) return;

    const newA = document.createElement('a');
    newA.innerText = 'NUEVA SECCIÓN';
    navLinksContainer.appendChild(newA);

    if (typeof bindHeaderNavEvents === 'function') bindHeaderNavEvents();
    renderHeaderTabsManager();
    saveAllSettings();
}

function deleteHeaderTab() {
    const index = parseInt(document.getElementById('edit-tab-index').value);
    const navLinks = document.querySelectorAll('#main-nav-links a');

    if (index >= 0 && index < navLinks.length) navLinks[index].remove();
    closeHeaderTabModal();

    if (typeof bindHeaderNavEvents === 'function') bindHeaderNavEvents();
    renderHeaderTabsManager();
    saveAllSettings();
}

// Hero Modals
let currentHeroColNum = null;
let tempHeroImgBase64 = null;

function openHeroModal(colNum) {
    currentHeroColNum = colNum;
    document.getElementById('hero-modal-title').innerText = "EDITAR HERO " + colNum;
    document.getElementById('edit-hero-file').value = '';
    document.getElementById('hero-mod-title').value = document.getElementById('text-col' + colNum + '-title').innerText;
    const sub = document.getElementById('text-col' + colNum + '-sub');
    document.getElementById('hero-mod-sub').value = sub ? sub.innerText : '';
    tempHeroImgBase64 = null;
    document.getElementById('edit-hero-modal').classList.add('active');
}

function closeHeroModal() {
    document.getElementById('edit-hero-modal').classList.remove('active');
}

function applyHeroChanges() {
    if (currentHeroColNum) {
        const targetCol = document.getElementById('hero-col-' + currentHeroColNum);
        if (tempHeroImgBase64 && targetCol) targetCol.style.backgroundImage = `url('${tempHeroImgBase64}')`;

        const titleElem = document.getElementById('text-col' + currentHeroColNum + '-title');
        if (titleElem) titleElem.innerText = document.getElementById('hero-mod-title').value;

        const subElem = document.getElementById('text-col' + currentHeroColNum + '-sub');
        if (subElem) subElem.innerText = document.getElementById('hero-mod-sub').value;
    }
    closeHeroModal();
    saveAllSettings();
}

// Info & Footer Modals
let currentInfoColNum = null;
function openInfoModal(colNum) {
    currentInfoColNum = colNum;
    document.getElementById('info-modal-title').innerText = "EDITAR INFO " + colNum;
    document.getElementById('info-mod-title').value = document.getElementById('text-info-title-' + colNum).innerText;
    document.getElementById('info-mod-desc').value = document.getElementById('text-info-desc-' + colNum).innerText;
    document.getElementById('edit-info-modal').classList.add('active');
}
function closeInfoModal() { document.getElementById('edit-info-modal').classList.remove('active'); }
function applyInfoChanges() {
    if (currentInfoColNum) {
        document.getElementById('text-info-title-' + currentInfoColNum).innerText = document.getElementById('info-mod-title').value;
        document.getElementById('text-info-desc-' + currentInfoColNum).innerText = document.getElementById('info-mod-desc').value;
    }
    closeInfoModal();
    saveAllSettings();
}

function openNewsModal() {
    document.getElementById('news-mod-title').value = document.getElementById('text-news-title').innerText;
    document.getElementById('edit-news-modal').classList.add('active');
}
function closeNewsModal() { document.getElementById('edit-news-modal').classList.remove('active'); }
function applyNewsChanges() {
    document.getElementById('text-news-title').innerText = document.getElementById('news-mod-title').value;
    closeNewsModal();
    saveAllSettings();
}

let currentFooterCol = null;
function openFooterModal(colNum) {
    currentFooterCol = colNum;
    document.getElementById('footer-modal-title').innerText = "EDITAR FOOTER " + colNum;
    const clone = document.getElementById('footer-col-' + colNum).cloneNode(true);
    const btn = clone.querySelector('.edit-footer-btn');
    if (btn) btn.remove();
    document.getElementById('footer-mod-html').value = clone.innerHTML;
    document.getElementById('edit-footer-modal').classList.add('active');
}
function closeFooterModal() { document.getElementById('edit-footer-modal').classList.remove('active'); }
function applyFooterChanges() {
    if (currentFooterCol) {
        const colElem = document.getElementById('footer-col-' + currentFooterCol);
        const editBtnHtml = colElem.querySelector('.edit-footer-btn').outerHTML;
        colElem.innerHTML = editBtnHtml + document.getElementById('footer-mod-html').value;
    }
    closeFooterModal();
    saveAllSettings();
}

function openNewsletterForm() { document.getElementById('newsletter-form-modal').classList.add('active'); }
function closeNewsletterForm() { document.getElementById('newsletter-form-modal').classList.remove('active'); }
function submitNewsletter(e) {
    e.preventDefault();
    alert("¡Registro Exitoso al Newsletter de Phenom!");
    closeNewsletterForm();
}

// --- PERSISTENCIA LOCALSTORAGE ---
function saveAllSettings() {
    const settings = {
        fubBar: document.getElementById('edit-fub-bar')?.value || '',
        tbBgColor: document.getElementById('tb-bg-color')?.value || '#000000',
        tbOpacity: document.getElementById('tb-opacity')?.value || '1',
        tbBorderW: document.getElementById('tb-border-w')?.value || '0',
        tbBorderC: document.getElementById('tb-border-c')?.value || '#ca8a04',
        tbBorderR: document.getElementById('tb-border-r')?.value || '0',

        navBgColor: document.getElementById('nav-bg-color')?.value || '#ffffff',
        navTextColor: document.getElementById('nav-text-color')?.value || '#000000',
        navFont: document.getElementById('nav-font')?.value || "'Segoe UI', sans-serif",
        navFontSize: document.getElementById('nav-font-size')?.value || '13',
        navGap: document.getElementById('nav-gap')?.value || '25',
        headerPaddingV: document.getElementById('header-padding-v')?.value || '15',

        logoSrc: document.getElementById('logo-trigger')?.dataset.customLogo || document.getElementById('logo-trigger')?.src || '',
        logoWidth: document.getElementById('logo-width')?.value || '170',
        logoAdjText: document.getElementById('logo-adj-text-input')?.value || '',
        logoAdjFont: document.getElementById('logo-adj-font')?.value || "'Impact', sans-serif",
        logoAdjColor: document.getElementById('logo-adj-color')?.value || '#000000',
        logoAdjSpacing: document.getElementById('logo-adj-spacing')?.value || '0',
        logoTextFormat: logoTextFormat,

        wpNum: document.querySelector('.wp-float')?.href.replace('https://wa.me/', '') || '59893418239',
        headerNavHtml: document.getElementById('main-nav-links')?.innerHTML || '',

        hero1Title: document.getElementById('text-col1-title')?.innerText || '',
        hero1Sub: document.getElementById('text-col1-sub')?.innerText || '',
        hero1Bg: document.getElementById('hero-col-1')?.style.backgroundImage || '',

        hero2Title: document.getElementById('text-col2-title')?.innerText || '',
        hero2Sub: document.getElementById('text-col2-sub')?.innerText || '',
        hero2Bg: document.getElementById('hero-col-2')?.style.backgroundImage || '',

        hero3Title: document.getElementById('text-col3-title')?.innerText || '',
        hero3Sub: document.getElementById('text-col3-sub')?.innerText || '',
        hero3Bg: document.getElementById('hero-col-3')?.style.backgroundImage || '',

        info1Title: document.getElementById('text-info-title-1')?.innerText || '',
        info1Desc: document.getElementById('text-info-desc-1')?.innerText || '',
        info2Title: document.getElementById('text-info-title-2')?.innerText || '',
        info2Desc: document.getElementById('text-info-desc-2')?.innerText || '',

        newsTitle: document.getElementById('text-news-title')?.innerText || '',
        footer1: document.getElementById('footer-col-1')?.innerHTML || '',
        footer2: document.getElementById('footer-col-2')?.innerHTML || '',
        footer3: document.getElementById('footer-col-3')?.innerHTML || '',
        footer4: document.getElementById('footer-col-4')?.innerHTML || '',

        screenSettings: screenSettings,
        productsData: productsData,
        featuredProducts: featuredProducts
    };

    try {
        localStorage.setItem('phenom_persistent_data', JSON.stringify(settings));
        triggerSaveToast();
    } catch (err) {
        alert("¡Atención! Memoria local del navegador llena. Elimina productos viejos o usa fotos más livianas.");
    }
}

function triggerSaveToast() {
    const toast = document.getElementById('toast-success');
    if (!toast) return;

    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2500);
}

// RESTAURAR ESTADO AL CARGAR PÁGINA
window.onload = () => {
    initLogoUnlockTrigger();

    const editHeroFile = document.getElementById('edit-hero-file');
    if (editHeroFile) {
        editHeroFile.addEventListener('change', function (e) {
            if (e.target.files[0]) {
                compressImage(e.target.files[0], 1000, 1000, 0.7, (compressedUrl) => tempHeroImgBase64 = compressedUrl);
            }
        });
    }

    const editLogoFile = document.getElementById('edit-logo-file');
    if (editLogoFile) {
        editLogoFile.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    const logoTrigger = document.getElementById('logo-trigger');
                    if (logoTrigger) {
                        logoTrigger.src = event.target.result;
                        logoTrigger.dataset.customLogo = event.target.result;
                        saveAllSettings();
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const saved = localStorage.getItem('phenom_persistent_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.fubBar !== undefined && document.getElementById('edit-fub-bar')) document.getElementById('edit-fub-bar').value = data.fubBar;
            if (data.tbBgColor && document.getElementById('tb-bg-color')) document.getElementById('tb-bg-color').value = data.tbBgColor;
            if (data.tbOpacity !== undefined && document.getElementById('tb-opacity')) document.getElementById('tb-opacity').value = data.tbOpacity;
            if (data.tbBorderW !== undefined && document.getElementById('tb-border-w')) document.getElementById('tb-border-w').value = data.tbBorderW;
            if (data.tbBorderC && document.getElementById('tb-border-c')) document.getElementById('tb-border-c').value = data.tbBorderC;
            if (data.tbBorderR !== undefined && document.getElementById('tb-border-r')) document.getElementById('tb-border-r').value = data.tbBorderR;
            if (typeof applyTopBarSettings === 'function') applyTopBarSettings();

            if (data.navBgColor && document.getElementById('nav-bg-color')) document.getElementById('nav-bg-color').value = data.navBgColor;
            if (data.navTextColor && document.getElementById('nav-text-color')) document.getElementById('nav-text-color').value = data.navTextColor;
            if (data.navFont && document.getElementById('nav-font')) document.getElementById('nav-font').value = data.navFont;
            if (data.navFontSize !== undefined && document.getElementById('nav-font-size')) document.getElementById('nav-font-size').value = data.navFontSize;
            if (data.navGap !== undefined && document.getElementById('nav-gap')) document.getElementById('nav-gap').value = data.navGap;
            if (data.headerPaddingV !== undefined && document.getElementById('header-padding-v')) document.getElementById('header-padding-v').value = data.headerPaddingV;
            if (typeof applyNavSettings === 'function') applyNavSettings();

            const logoTrigger = document.getElementById('logo-trigger');
            if (data.logoSrc && logoTrigger) {
                logoTrigger.src = data.logoSrc;
                logoTrigger.dataset.customLogo = data.logoSrc;
            }
            if (data.logoWidth && document.getElementById('logo-width')) document.getElementById('logo-width').value = data.logoWidth;
            if (data.logoAdjText !== undefined && document.getElementById('logo-adj-text-input')) document.getElementById('logo-adj-text-input').value = data.logoAdjText;
            if (data.logoAdjFont && document.getElementById('logo-adj-font')) document.getElementById('logo-adj-font').value = data.logoAdjFont;
            if (data.logoAdjColor && document.getElementById('logo-adj-color')) document.getElementById('logo-adj-color').value = data.logoAdjColor;
            if (data.logoAdjSpacing !== undefined && document.getElementById('logo-adj-spacing')) document.getElementById('logo-adj-spacing').value = data.logoAdjSpacing;
            if (data.logoTextFormat) {
                logoTextFormat = data.logoTextFormat;
                if (document.getElementById('fmt-logo-b')) document.getElementById('fmt-logo-b').classList.toggle('active', logoTextFormat.bold);
                if (document.getElementById('fmt-logo-i')) document.getElementById('fmt-logo-i').classList.toggle('active', logoTextFormat.italic);
                if (document.getElementById('fmt-logo-s')) document.getElementById('fmt-logo-s').classList.toggle('active', logoTextFormat.underline);
            }
            if (typeof applyLogoTextSettings === 'function') applyLogoTextSettings();

            if (data.wpNum && document.querySelector('.wp-float')) document.querySelector('.wp-float').href = 'https://wa.me/' + data.wpNum;
            if (data.headerNavHtml && document.getElementById('main-nav-links')) document.getElementById('main-nav-links').innerHTML = data.headerNavHtml;

            if (data.hero1Title && document.getElementById('text-col1-title')) document.getElementById('text-col1-title').innerText = data.hero1Title;
            if (data.hero1Sub && document.getElementById('text-col1-sub')) document.getElementById('text-col1-sub').innerText = data.hero1Sub;
            if (data.hero1Bg && document.getElementById('hero-col-1')) document.getElementById('hero-col-1').style.backgroundImage = data.hero1Bg;

            if (data.hero2Title && document.getElementById('text-col2-title')) document.getElementById('text-col2-title').innerText = data.hero2Title;
            if (data.hero2Sub && document.getElementById('text-col2-sub')) document.getElementById('text-col2-sub').innerText = data.hero2Sub;
            if (data.hero2Bg && document.getElementById('hero-col-2')) document.getElementById('hero-col-2').style.backgroundImage = data.hero2Bg;

            if (data.hero3Title && document.getElementById('text-col3-title')) document.getElementById('text-col3-title').innerText = data.hero3Title;
            if (data.hero3Sub && document.getElementById('text-col3-sub')) document.getElementById('text-col3-sub').innerText = data.hero3Sub;
            if (data.hero3Bg && document.getElementById('hero-col-3')) document.getElementById('hero-col-3').style.backgroundImage = data.hero3Bg;

            if (data.info1Title && document.getElementById('text-info-title-1')) document.getElementById('text-info-title-1').innerText = data.info1Title;
            if (data.info1Desc && document.getElementById('text-info-desc-1')) document.getElementById('text-info-desc-1').innerText = data.info1Desc;
            if (data.info2Title && document.getElementById('text-info-title-2')) document.getElementById('text-info-title-2').innerText = data.info2Title;
            if (data.info2Desc && document.getElementById('text-info-desc-2')) document.getElementById('text-info-desc-2').innerText = data.info2Desc;

            if (data.newsTitle && document.getElementById('text-news-title')) document.getElementById('text-news-title').innerText = data.newsTitle;
            if (data.footer1 && document.getElementById('footer-col-1')) document.getElementById('footer-col-1').innerHTML = data.footer1;
            if (data.footer2 && document.getElementById('footer-col-2')) document.getElementById('footer-col-2').innerHTML = data.footer2;
            if (data.footer3 && document.getElementById('footer-col-3')) document.getElementById('footer-col-3').innerHTML = data.footer3;
            if (data.footer4 && document.getElementById('footer-col-4')) document.getElementById('footer-col-4').innerHTML = data.footer4;

            if (data.screenSettings) screenSettings = data.screenSettings;
            if (data.productsData) productsData = data.productsData;
            if (data.featuredProducts) featuredProducts = data.featuredProducts;
        } catch (e) {
            console.error("Error al restaurar datos:", e);
        }
    }

    if (typeof bindHeaderNavEvents === 'function') bindHeaderNavEvents();
    loadScreenBgSettings();
    renderCarouselFront();
};
