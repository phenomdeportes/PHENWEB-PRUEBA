const PHENOM_PLACEHOLDER_IMG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='100%' height='100%' fill='%2318181b'/><text x='50%' y='48%' dominant-baseline='middle' text-anchor='middle' fill='%23eab308' font-family='Arial, sans-serif' font-weight='900' font-size='24'>PHENOM</text><text x='50%' y='58%' dominant-baseline='middle' text-anchor='middle' fill='%2371717a' font-family='Arial, sans-serif' font-weight='bold' font-size='12'>SIN IMAGEN</text></svg>";
/* ==========================================================================
   PHENOM STORE - LÓGICA DEL CARRITO DE COMPRAS (cart.js)
   ========================================================================== */

let cart = [];
let selectedShippingMethod = 'retiro'; // 'retiro' (Gratis) o 'domicilio' ($180 UYU)
let pendingProductForVariant = null;

// --- ABRIR Y CERRAR CARRITO ---
function toggleCartDrawer(forceOpen) {
    const overlay = document.getElementById('cart-drawer-overlay');
    const drawer = document.getElementById('cart-drawer');
    if (!overlay || !drawer) return;

    if (typeof forceOpen === 'boolean') {
        if (forceOpen) {
            overlay.classList.add('active');
            drawer.classList.add('active');
        } else {
            overlay.classList.remove('active');
            drawer.classList.remove('active');
        }
    } else {
        overlay.classList.toggle('active');
        drawer.classList.toggle('active');
    }
}

// --- UTILIDAD: PARSEAR PRECIO A NÚMERO ---
function parsePriceToNumber(priceStr) {
    if (!priceStr) return 0;
    // Extrae solo dígitos numéricos del string
    const cleaned = priceStr.toString().replace(/[^0-9]/g, '');
    return parseInt(cleaned, 10) || 0;
}

// --- ACTUALIZAR CONTADOR DEL HEADER ---
function updateCartBadge() {
    const badge = document.getElementById('cart-badge-count');
    if (!badge) return;

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.innerText = totalCount;
    badge.style.display = totalCount > 0 ? 'flex' : 'none';
}

// --- AGREGAR PRODUCTO AL CARRITO ---
function handleAddToCartClick(productId) {
    // Buscar el producto en el catálogo global
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    // Si tiene múltiples variantes y no se especificó una, abrir modal de selección
    if (product.variants && product.variants.length > 1) {
        openVariantModal(product);
    } else {
        const variant = (product.variants && product.variants.length === 1) ? product.variants[0] : 'Única';
        addToCart(product, variant);
    }
}

function addToCart(product, variant) {
    const numericPrice = parsePriceToNumber(product.price);
    const existingIndex = cart.findIndex(item => item.id === product.id && item.variant === variant);

    if (existingIndex !== -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            variant: variant || 'Única',
            priceStr: product.price,
            priceNum: numericPrice,
            image: (product.media && product.media[0]) ? product.media[0] : PHENOM_PLACEHOLDER_IMG,
            quantity: 1
        });
    }

    saveCartToStorage();
    updateCartBadge();
    renderCartDrawer();
    toggleCartDrawer(true);
}

// --- MODAL DE SELECCIÓN DE VARIANTE ---
function openVariantModal(product) {
    pendingProductForVariant = product;
    const modal = document.getElementById('variant-modal-overlay');
    const container = document.getElementById('variant-modal-options');
    const title = document.getElementById('variant-modal-prod-title');

    if (!modal || !container) return;

    title.innerText = product.title;
    container.innerHTML = '';

    product.variants.forEach(variant => {
        const btn = document.createElement('button');
        btn.className = 'variant-btn-select';
        btn.innerText = variant;
        btn.onclick = () => {
            closeVariantModal();
            addToCart(pendingProductForVariant, variant);
        };
        container.appendChild(btn);
    });

    modal.classList.add('active');
}

function closeVariantModal() {
    const modal = document.getElementById('variant-modal-overlay');
    if (modal) modal.classList.remove('active');
    pendingProductForVariant = null;
}

// --- MODIFICAR CANTIDAD O ELIMINAR ---
function changeCartQuantity(index, delta) {
    if (index < 0 || index >= cart.length) return;

    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    saveCartToStorage();
    updateCartBadge();
    renderCartDrawer();
}

function removeFromCart(index) {
    if (index < 0 || index >= cart.length) return;

    cart.splice(index, 1);
    saveCartToStorage();
    updateCartBadge();
    renderCartDrawer();
}

// --- SELECCIONAR MÉTODO DE ENVÍO ---
function setShippingMethod(method) {
    selectedShippingMethod = method;
    renderCartDrawer();
}

// --- RENDERIZAR PANEL DEL CARRITO ---
function renderCartDrawer() {
    const bodyContainer = document.getElementById('cart-drawer-body');
    const footerContainer = document.getElementById('cart-drawer-footer');
    if (!bodyContainer || !footerContainer) return;

    if (cart.length === 0) {
        bodyContainer.innerHTML = `
            <div class="cart-empty-state">
                <div class="cart-empty-icon">🛒</div>
                <div class="cart-empty-text">Tu carrito está vacío</div>
                <p style="font-size:12px; color:#94a3b8;">¡Agregá tus guantes y equipamiento Phenom preferidos para entrenar!</p>
            </div>
        `;
        footerContainer.style.display = 'none';
        return;
    }

    footerContainer.style.display = 'block';

    // Lista de productos
    let itemsHtml = '<div class="cart-items-list">';
    let subtotalNum = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.priceNum * item.quantity;
        subtotalNum += itemTotal;

        itemsHtml += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.title}" class="cart-item-img">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-variant">Opción: <strong>${item.variant}</strong></div>
                    <div class="cart-item-price">$${itemTotal.toLocaleString('es-UY')} UYU</div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="changeCartQuantity(${index}, -1)">-</button>
                        <span class="qty-number">${item.quantity}</span>
                        <button class="qty-btn" onclick="changeCartQuantity(${index}, 1)">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${index})" title="Eliminar ítem">🗑️</button>
            </div>
        `;
    });
    itemsHtml += '</div>';

    // Selector de método de envío
    const shippingCost = selectedShippingMethod === 'domicilio' ? 180 : 0;
    const finalTotal = subtotalNum + shippingCost;

    const shippingHtml = `
        <div class="shipping-selector-box">
            <div class="shipping-box-title">🚚 Método de Envío</div>
            <div class="shipping-option ${selectedShippingMethod === 'retiro' ? 'selected' : ''}" onclick="setShippingMethod('retiro')">
                <div class="shipping-option-left">
                    <input type="radio" name="shipping_method" value="retiro" ${selectedShippingMethod === 'retiro' ? 'checked' : ''}>
                    <span>Punto de Retiro (Tienda)</span>
                </div>
                <span class="shipping-price-tag">GRATIS</span>
            </div>
            <div class="shipping-option ${selectedShippingMethod === 'domicilio' ? 'selected' : ''}" onclick="setShippingMethod('domicilio')">
                <div class="shipping-option-left">
                    <input type="radio" name="shipping_method" value="domicilio" ${selectedShippingMethod === 'domicilio' ? 'checked' : ''}>
                    <span>Envío a Domicilio</span>
                </div>
                <span class="shipping-price-tag cost">$180 UYU</span>
            </div>
        </div>
    `;

    bodyContainer.innerHTML = itemsHtml + shippingHtml;

    // Resumen y botón Checkout WhatsApp
    footerContainer.innerHTML = `
        <div class="cart-summary-row">
            <span>Subtotal:</span>
            <span>$${subtotalNum.toLocaleString('es-UY')} UYU</span>
        </div>
        <div class="cart-summary-row">
            <span>Envío:</span>
            <span>${shippingCost === 0 ? 'GRATIS' : '$180 UYU'}</span>
        </div>
        <div class="cart-summary-row total-row">
            <span>TOTAL:</span>
            <span>$${finalTotal.toLocaleString('es-UY')} UYU</span>
        </div>
        <button class="btn-whatsapp-checkout" onclick="generateWhatsAppOrder()">
            <span>Finalizar Compra vía WhatsApp</span> ✆
        </button>
    `;
}

// --- GENERAR Y ENVIAR PEDIDO A WHATSAPP ---
function generateWhatsAppOrder() {
    if (cart.length === 0) return;

    let subtotalNum = 0;
    let itemsText = '';

    cart.forEach((item, index) => {
        const itemTotal = item.priceNum * item.quantity;
        subtotalNum += itemTotal;
        itemsText += `• *${item.title}* (${item.variant}) x${item.quantity} - $${itemTotal.toLocaleString('es-UY')} UYU\n`;
    });

    const shippingText = selectedShippingMethod === 'domicilio' 
        ? 'Envío a Domicilio ($180 UYU)' 
        : 'Punto de Retiro en Tienda (Gratis)';

    const shippingCost = selectedShippingMethod === 'domicilio' ? 180 : 0;
    const finalTotal = subtotalNum + shippingCost;

    let message = `¡Hola PHENOM! 👋 Quisiera realizar el siguiente pedido:\n\n`;
    message += `📦 *DETALLE DE PRODUCTOS:*\n${itemsText}\n`;
    message += `🚚 *MÉTODO DE ENVÍO:*\n• ${shippingText}\n\n`;
    message += `💰 *TOTAL A PAGAR:* $${finalTotal.toLocaleString('es-UY')} UYU\n\n`;
    message += `Quedo a la espera para coordinar el pago y la entrega. ¡Muchas gracias!`;

    const encodedMsg = encodeURIComponent(message);
    const phoneNumber = '59893418239'; // Número oficial Phenom
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMsg}`;

    window.open(whatsappUrl, '_blank');
}

// --- PERSISTENCIA DEL CARRITO ---
function saveCartToStorage() {
    try {
        localStorage.setItem('phenom_cart_data', JSON.stringify(cart));
    } catch (e) {
        console.error("Error al guardar carrito en localStorage:", e);
    }
}

function loadCartFromStorage() {
    const saved = localStorage.getItem('phenom_cart_data');
    if (saved) {
        try {
            cart = JSON.parse(saved) || [];
        } catch (e) {
            cart = [];
        }
    }
    updateCartBadge();
    renderCartDrawer();
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadCartFromStorage();
});
