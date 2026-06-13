let selectedPayment = 'cod';
let lenis; // Declare lenis globally for navigation functions

// State variables (will be initialized after DOM load)
let cart = [];
let appliedPromo = null;
const PROMO_CODES = { 'DISCOUNT50': 0.5 };

function parsePrice(str) { 
    return parseFloat(String(str).replace(/[^0-9.]/g, '')) || 0; 
}

function fmt(n) { 
    return '$' + n.toFixed(2); 
}

function saveCart() { 
    localStorage.setItem('saint_cart', JSON.stringify(cart)); 
}

function savePromo() { 
    localStorage.setItem('saint_promo', JSON.stringify(appliedPromo)); 
}

function calcTotals() {
    const subtotal = cart.reduce((s, i) => s + parsePrice(i.price) * i.qty, 0);
    const discount = appliedPromo ? subtotal * appliedPromo.rate : 0;
    const discounted = subtotal - discount;
    const tax = discounted * 0.1;
    const total = discounted + tax;
    return { subtotal, discount, tax, total };
}

function calcCheckoutTotals(cartItems) {
    const subtotal = cartItems.reduce((s, i) => s + parsePrice(i.price) * i.qty, 0);
    const discount = appliedPromo ? subtotal * appliedPromo.rate : 0;
    const discounted = subtotal - discount;
    const tax = discounted * 0.1;
    const total = discounted + tax;
    return { subtotal, discount, tax, total };
}

function updateBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    const count = cart.reduce((s, i) => s + i.qty, 0);
    badge.textContent = count;
    if (count > 0) {
        badge.classList.add('visible');
    } else {
        badge.classList.remove('visible');
    }
}

function renderCart() {
    const list = document.getElementById('cartItemsList');
    const emptyState = document.getElementById('emptyCartState');
    const footer = document.getElementById('cartFooter');
    const countEl = document.getElementById('cartItemCount');
    const totalCount = cart.reduce((s, i) => s + i.qty, 0);

    if (countEl) countEl.textContent = totalCount + ' item' + (totalCount !== 1 ? 's' : '');

    if (!list) return;
    
    if (cart.length === 0) {
        list.innerHTML = '';
        if (emptyState) {
            list.appendChild(emptyState);
            emptyState.style.display = 'flex';
        }
        if (footer) footer.style.display = 'none';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (footer) footer.style.display = 'block';

    // Clear and rebuild for simplicity (ensures consistency)
    list.innerHTML = '';
    cart.forEach(item => {
        const card = document.createElement('div');
        card.className = 'cart-item-card';
        card.dataset.cartId = item.id;
        card.innerHTML = `
            <img class="cart-item-img" src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/72x72/1a1a1a/d4af37?text=L'">
            <div style="flex:1;min-width:0;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                    <p style="font-size:13px;font-weight:600;line-height:1.3;flex:1;">${item.name}</p>
                    <button class="remove-btn" onclick="CartSystem.removeItem('${item.id}')"><i class="fas fa-trash-alt"></i></button>
                </div>
                <p style="font-size:13px;color:#d4af37;margin:4px 0 10px;">${item.price}</p>
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <button class="qty-btn" onclick="CartSystem.changeQty('${item.id}',-1)"><i class="fas fa-minus" style="font-size:10px;"></i></button>
                        <span style="font-size:14px;font-weight:600;min-width:20px;text-align:center;">${item.qty}</span>
                        <button class="qty-btn" onclick="CartSystem.changeQty('${item.id}',1)"><i class="fas fa-plus" style="font-size:10px;"></i></button>
                    </div>
                    <p style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.7);">${fmt(parsePrice(item.price) * item.qty)}</p>
                </div>
            </div>`;
        list.appendChild(card);
    });
    updateSummary();
}

function updateSummary() {
    const { subtotal, discount, tax, total } = calcTotals();
    const subtotalEl = document.getElementById('summarySubtotal');
    const discountEl = document.getElementById('summaryDiscount');
    const discountRow = document.getElementById('discountRow');
    const taxEl = document.getElementById('summaryTax');
    const totalEl = document.getElementById('summaryTotal');
    
    if (subtotalEl) subtotalEl.textContent = fmt(subtotal);
    if (discountEl) discountEl.textContent = '-' + fmt(discount);
    if (discountRow) discountRow.style.display = appliedPromo ? 'flex' : 'none';
    if (taxEl) taxEl.textContent = fmt(tax);
    if (totalEl) totalEl.textContent = fmt(total);
}

window.CartSystem = {
    addItem(name, price, image) {
        const id = name.toLowerCase().replace(/\s+/g, '-');
        const existing = cart.find(i => i.id === id);
        if (existing) {
            existing.qty++;
        } else {
            cart.push({ id, name, price, image, qty: 1 });
        }
        saveCart();
        renderCart();
        updateBadge();
        openCart();
    },
    removeItem(id) {
        cart = cart.filter(i => i.id !== id);
        saveCart();
        renderCart();
        updateBadge();
    },
    changeQty(id, delta) {
        const item = cart.find(i => i.id === id);
        if (!item) return;
        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        saveCart();
        renderCart();
        updateBadge();
    }
};

function openCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
    document.body.style.overflow = '';
}

function selectPayment(method) {
    selectedPayment = method;
    document.querySelectorAll('.payment-option').forEach(el => {
        if (el.dataset.method === method) {
            el.classList.add('selected');
        } else {
            el.classList.remove('selected');
        }
    });
}

function openCheckout() {
    const currentCart = JSON.parse(localStorage.getItem('saint_cart') || '[]');
    if (currentCart.length === 0) return;

    // Populate checkout order summary
    const itemsEl = document.getElementById('checkoutOrderItems');
    if (itemsEl) {
        itemsEl.innerHTML = currentCart.map(item => {
            const subtotal = parsePrice(item.price) * item.qty;
            return `<div class="order-summary-item">
                <div style="display:flex;align-items:center;gap:10px;">
                    <img src="${item.image}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;" onerror="this.src='https://via.placeholder.com/44/1a1a1a/d4af37?text=L'">
                    <div><p style="font-size:13px;font-weight:600;">${item.name}</p><p style="font-size:11px;color:rgba(255,255,255,0.4);">Qty: ${item.qty}</p></div>
                </div>
                <span style="font-size:13px;font-weight:600;color:#d4af37;">$${subtotal.toFixed(2)}</span>
            </div>`;
        }).join('');
    }

    const t = calcCheckoutTotals(currentCart);
    const coSubtotal = document.getElementById('co_subtotal');
    const coDiscount = document.getElementById('co_discount');
    const coDiscountRow = document.getElementById('co_discountRow');
    const coTax = document.getElementById('co_tax');
    const coTotal = document.getElementById('co_total');
    
    if (coSubtotal) coSubtotal.textContent = '$' + t.subtotal.toFixed(2);
    if (coDiscount) coDiscount.textContent = '-$' + t.discount.toFixed(2);
    if (coDiscountRow) coDiscountRow.style.display = t.discount > 0 ? 'flex' : 'none';
    if (coTax) coTax.textContent = '$' + t.tax.toFixed(2);
    if (coTotal) coTotal.textContent = '$' + t.total.toFixed(2);

    showCheckoutScreen('screenCheckout');
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function showCheckoutScreen(id) {
    document.querySelectorAll('.checkout-screen').forEach(s => s.classList.remove('active'));
    const activeScreen = document.getElementById(id);
    if (activeScreen) activeScreen.classList.add('active');
}

function closeCheckout() {
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
}

function closeCheckoutCompletely() {
    // Clear cart after successful order
    localStorage.removeItem('saint_cart');
    localStorage.removeItem('saint_promo');
    cart = [];
    appliedPromo = null;
    
    // Re-render cart in sidebar (empty)
    const cartEl = document.getElementById('cartItemsList');
    const emptyState = document.getElementById('emptyCartState');
    if (cartEl && emptyState) {
        cartEl.innerHTML = '';
        cartEl.appendChild(emptyState);
        emptyState.style.display = 'flex';
    }
    const footer = document.getElementById('cartFooter');
    if (footer) footer.style.display = 'none';
    
    const badge = document.getElementById('cartBadge');
    if (badge) badge.classList.remove('visible');
    
    const countEl = document.getElementById('cartItemCount');
    if (countEl) countEl.textContent = '0 items';
    
    // Reset promo UI
    const promoInput = document.getElementById('promoInput');
    const promoBtn = document.getElementById('promoApplyBtn');
    const promoMsg = document.getElementById('promoMsg');
    if (promoInput) promoInput.disabled = false;
    if (promoBtn) {
        promoBtn.disabled = false;
        promoBtn.style.opacity = '1';
    }
    if (promoMsg) promoMsg.textContent = '';
}

function validateCheckoutForm() {
    const fields = [
        { id: 'fieldName',    err: 'errName',    label: 'Full name', regex: /^.{2,}$/ },
        { id: 'fieldEmail',   err: 'errEmail',   label: 'Email',     regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        { id: 'fieldPhone',   err: 'errPhone',   label: 'Phone',     regex: /^[\d\s\+\-\(\)]{7,}$/ },
        { id: 'fieldAddress', err: 'errAddress', label: 'Address',   regex: /^.{5,}$/ },
        { id: 'fieldCity',    err: 'errCity',    label: 'City',      regex: /^.{2,}$/ },
        { id: 'fieldPostal',  err: 'errPostal',  label: 'Postal code', regex: /^.{3,}$/ }
    ];
    let valid = true;
    fields.forEach(f => {
        const input = document.getElementById(f.id);
        const errEl = document.getElementById(f.err);
        if (!input || !errEl) return;
        input.classList.remove('error-field');
        errEl.textContent = '';
        if (!f.regex.test(input.value.trim())) {
            input.classList.add('error-field');
            errEl.textContent = `Please enter a valid ${f.label.toLowerCase()}.`;
            valid = false;
        }
    });
    return valid;
}

function placeOrder() {
    if (!validateCheckoutForm()) return;

    const processing = document.getElementById('processingOverlay');
    if (processing) processing.classList.add('show');

    setTimeout(() => {
        if (processing) processing.classList.remove('show');
        completeOrder();
    }, 1800);
}

function completeOrder() {
    const currentCart = JSON.parse(localStorage.getItem('saint_cart') || '[]');
    const t = calcCheckoutTotals(currentCart);

    const paymentLabels = { cod: 'Cash on Delivery', bank: 'Bank Transfer', card: 'Credit / Debit Card', ewallet: 'E-Wallet' };

    const order = {
        id: 'LT-' + Date.now().toString(36).toUpperCase(),
        date: new Date().toLocaleString('en-US', { year:'numeric', month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit' }),
        customer: {
            name:    document.getElementById('fieldName')?.value.trim() || '',
            email:   document.getElementById('fieldEmail')?.value.trim() || '',
            phone:   document.getElementById('fieldPhone')?.value.trim() || '',
            address: (document.getElementById('fieldAddress')?.value.trim() || '') + ', ' + (document.getElementById('fieldCity')?.value.trim() || '') + ' ' + (document.getElementById('fieldPostal')?.value.trim() || ''),
            notes:   document.getElementById('fieldNotes')?.value.trim() || ''
        },
        items: currentCart,
        promo: appliedPromo,
        totals: t,
        payment: selectedPayment,
        paymentLabel: paymentLabels[selectedPayment]
    };

    // Save to order history
    const history = JSON.parse(localStorage.getItem('saint_orders') || '[]');
    history.unshift(order);
    localStorage.setItem('saint_orders', JSON.stringify(history));

    // Populate confirmation screen
    const confOrderId = document.getElementById('conf_orderId');
    const confDate = document.getElementById('conf_date');
    const confName = document.getElementById('conf_name');
    const confPayment = document.getElementById('conf_payment');
    const confTotal = document.getElementById('conf_total');
    const confItems = document.getElementById('conf_items');
    
    if (confOrderId) confOrderId.textContent = order.id;
    if (confDate) confDate.textContent = order.date;
    if (confName) confName.textContent = order.customer.name;
    if (confPayment) confPayment.textContent = order.paymentLabel;
    if (confTotal) confTotal.textContent = '$' + t.total.toFixed(2);
    
    if (confItems) {
        confItems.innerHTML = order.items.map(item => {
            const sub = parsePrice(item.price) * item.qty;
            return `<div class="order-summary-item">
                <span style="font-size:13px;">${item.name} × ${item.qty}</span>
                <span style="font-size:13px;color:#d4af37;">$${sub.toFixed(2)}</span>
            </div>`;
        }).join('') + `
            <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);">
                ${t.discount > 0 ? `<div class="summary-row discount"><span>Discount</span><span>-$${t.discount.toFixed(2)}</span></div>` : ''}
                <div class="summary-row"><span>Tax (10%)</span><span>$${t.tax.toFixed(2)}</span></div>
            </div>`;
    }

    window._lastOrder = order;
    showCheckoutScreen('screenConfirmation');
}

function downloadReceiptPDF() {
    const order = window._lastOrder;
    if (!order) return;

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Receipt – ${order.id}</title>
<style>
    body { font-family: 'Georgia', serif; background: #fff; color: #111; margin: 0; padding: 40px; max-width: 600px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #d4af37; padding-bottom: 20px; }
    .logo-text { font-size: 28px; font-weight: bold; letter-spacing: 4px; }
    .logo-l { color: #d4af37; }
    .logo-t { color: #111; }
    .tagline { font-size: 11px; color: #888; letter-spacing: 2px; margin-top: 4px; }
    h2 { font-size: 16px; letter-spacing: 2px; text-transform: uppercase; color: #d4af37; margin: 24px 0 10px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
    .info-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
    .item-row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
    .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; padding: 8px 0; }
    .grand { font-size: 16px; color: #d4af37; border-top: 2px solid #d4af37; margin-top: 8px; padding-top: 10px; }
    .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #aaa; letter-spacing: 1px; }
    @media print { body { padding: 20px; } }
</style>
</head><body>
<div class="header">
    <div class="logo-text"><span class="logo-l">SAINT</span><span class="logo-t">MONTÉ</span></div>
    <div class="tagline">Timeless Style, Exceptional Craftsmanship</div>
</div>

<h2>Order Information</h2>
<div class="info-row"><span>Order ID</span><span><strong>${order.id}</strong></span></div>
<div class="info-row"><span>Date</span><span>${order.date}</span></div>
<div class="info-row"><span>Payment</span><span>${order.paymentLabel}</span></div>

<h2>Customer Information</h2>
<div class="info-row"><span>Name</span><span>${order.customer.name}</span></div>
<div class="info-row"><span>Email</span><span>${order.customer.email}</span></div>
<div class="info-row"><span>Phone</span><span>${order.customer.phone}</span></div>
<div class="info-row"><span>Address</span><span>${order.customer.address}</span></div>
${order.customer.notes ? `<div class="info-row"><span>Notes</span><span>${order.customer.notes}</span></div>` : ''}

<h2>Items Purchased</h2>
${order.items.map(item => {
    const sub = parsePrice(item.price) * item.qty;
    return `<div class="item-row"><span>${item.name} × ${item.qty}</span><span>$${sub.toFixed(2)}</span></div>`;
}).join('')}

<div style="margin-top:16px;">
    <div class="total-row"><span>Subtotal</span><span>$${order.totals.subtotal.toFixed(2)}</span></div>
    ${order.totals.discount > 0 ? `<div class="total-row" style="color:#27ae60;"><span>Discount (${order.promo?.code})</span><span>-$${order.totals.discount.toFixed(2)}</span></div>` : ''}
    <div class="total-row"><span>Tax (10%)</span><span>$${order.totals.tax.toFixed(2)}</span></div>
    <div class="total-row grand"><span>Grand Total</span><span>$${order.totals.total.toFixed(2)}</span></div>
</div>

<div class="footer">
    <p>Thank you for shopping with SAINT MONTÉ</p>
    <p style="margin-top:4px;">© 2026 SAINT MONTÉ · All rights reserved</p>
</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 500);
    }
}

function viewOrderHistory() {
    const orders = JSON.parse(localStorage.getItem('saint_orders') || '[]');
    const listEl = document.getElementById('orderHistoryList');

    if (!listEl) return;
    
    if (orders.length === 0) {
        listEl.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.3);padding:40px 0;"><i class="fas fa-history" style="font-size:40px;opacity:0.3;display:block;margin-bottom:12px;"></i><p>No orders yet.</p></div>';
    } else {
        listEl.innerHTML = orders.map((order, idx) => `
            <div class="order-history-card" onclick="toggleOrderDetail(${idx})">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <p style="font-size:13px;font-weight:700;color:#d4af37;margin-bottom:3px;">${order.id}</p>
                        <p style="font-size:11px;color:rgba(255,255,255,0.4);">${order.date}</p>
                    </div>
                    <div style="text-align:right;">
                        <p style="font-size:14px;font-weight:700;">$${order.totals.total.toFixed(2)}</p>
                        <p style="font-size:11px;color:rgba(255,255,255,0.4);">${order.paymentLabel}</p>
                    </div>
                </div>
                <div id="orderDetail_${idx}" style="display:none;margin-top:14px;border-top:1px solid rgba(255,255,255,0.07);padding-top:14px;">
                    ${order.items.map(item => `<div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;color:rgba(255,255,255,0.7);">
                        <span>${item.name} × ${item.qty}</span>
                        <span>$${(parsePrice(item.price) * item.qty).toFixed(2)}</span>
                    </div>`).join('')}
                    <div style="margin-top:10px;font-size:12px;color:rgba(255,255,255,0.5);">
                        <div style="display:flex;justify-content:space-between;"><span>Customer</span><span>${order.customer.name}</span></div>
                        <div style="display:flex;justify-content:space-between;margin-top:3px;"><span>Address</span><span style="text-align:right;max-width:220px;">${order.customer.address}</span></div>
                    </div>
                    <button onclick="event.stopPropagation();redownloadReceipt(${idx})" style="margin-top:12px;background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.3);color:#d4af37;padding:8px 16px;border-radius:20px;font-size:11px;cursor:pointer;font-family:'Montserrat',sans-serif;letter-spacing:0.05em;">
                        <i class="fas fa-download" style="margin-right:6px;"></i>Download Receipt
                    </button>
                </div>
            </div>`).join('');
    }

    const modal = document.getElementById('orderHistoryModal');
    if (modal) modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function toggleOrderDetail(idx) {
    const el = document.getElementById('orderDetail_' + idx);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function redownloadReceipt(idx) {
    const orders = JSON.parse(localStorage.getItem('saint_orders') || '[]');
    if (orders[idx]) {
        window._lastOrder = orders[idx];
        downloadReceiptPDF();
    }
}

function closeOrderHistory() {
    const modal = document.getElementById('orderHistoryModal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
}

class InfiniteCarousel {
    constructor(trackId, items, dotsId, prevId, nextId, isBestseller) {
        this.track = document.getElementById(trackId);
        this.items = items;
        this.isBestseller = isBestseller;
        this.dotsContainer = document.getElementById(dotsId);
        this.prevBtn = document.getElementById(prevId);
        this.nextBtn = document.getElementById(nextId);
        this.currentIndex = 0;
        this.itemWidth = 352;
        this.totalItems = items.length;
        
        if (!this.track) return;
        
        this.createInfiniteTrack();
        this.updateTrackPosition(false);
        this.createDots();
        
        if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prev());
        if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.next());
        window.addEventListener('resize', () => this.updateTrackPosition(false));
    }
    
    createInfiniteTrack() {
        const triple = [...this.items, ...this.items, ...this.items];
        this.track.innerHTML = triple.map((item) => {
            if (this.isBestseller) {
                return `<div class="carousel-item p-6" data-product-name="${item.name}" data-product-price="${item.price}" data-product-image="${item.image}">
                    <div class="relative">
                        ${item.badge ? `<div class="absolute top-2 right-2 bg-gold text-black px-3 py-1 rounded-full text-sm font-bold z-10" style="background:#d4af37;">${item.badge}</div>` : ''}
                        <div class="overflow-hidden rounded-lg mb-4">
                            <img src="${item.image}" alt="${item.name}" class="w-full h-80 object-cover transition-transform duration-500 hover:scale-110">
                        </div>
                    </div>
                    <h3 class="text-2xl font-semibold mb-2">${item.name}</h3>
                    <div class="flex items-center mb-3">${this.generateStars(item.rating)}<span class="text-gray-400 ml-2">(${item.reviews} reviews)</span></div>
                    <p class="text-gray-400 mb-4">${item.desc}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-xl font-bold" style="color:#d4af37;">${item.price}</span>
                        <button class="bestseller-cart-btn px-4 py-2 rounded-full transition-all duration-300" data-add-to-cart>Add to Cart</button>
                    </div>
                </div>`;
            } else {
                return `<div class="carousel-item p-6" data-product-name="${item.name}" data-product-price="${item.price}" data-product-image="${item.image}">
                    <div class="overflow-hidden rounded-lg mb-4">
                        <img src="${item.image}" alt="${item.name}" class="w-full h-80 object-cover transition-transform duration-500 hover:scale-110">
                    </div>
                    <h3 class="text-2xl font-semibold mb-2">${item.name}</h3>
                    <p class="text-gray-400 mb-4">${item.desc}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-xl font-bold" style="color:#d4af37;">${item.price}</span>
                        <button class="add-to-cart-btn px-4 py-2 rounded-full transition-all duration-300" data-add-to-cart>Add to Cart</button>
                    </div>
                </div>`;
            }
        }).join('');
    }
    
    generateStars(rating) {
        let s = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(rating)) s += '<i class="fas fa-star text-gold text-sm" style="color:#d4af37;"></i>';
            else if (i === Math.ceil(rating) && rating % 1 !== 0) s += '<i class="fas fa-star-half-alt text-gold text-sm" style="color:#d4af37;"></i>';
            else s += '<i class="far fa-star text-gold text-sm" style="color:#d4af37;"></i>';
        }
        return s;
    }
    
    createDots() {
        if (!this.dotsContainer) return;
        this.dotsContainer.innerHTML = '';
        for (let i = 0; i < this.totalItems; i++) {
            const dot = document.createElement('div');
            dot.classList.add('carousel-dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => this.goToSlide(i));
            this.dotsContainer.appendChild(dot);
        }
    }
    
    updateDots() {
        if (!this.dotsContainer) return;
        this.dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            if (i === this.currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    updateTrackPosition(animate = true) {
        if (!this.track) return;
        const offset = -(this.currentIndex + this.totalItems) * this.itemWidth;
        if (!animate) this.track.style.transition = 'none';
        this.track.style.transform = `translateX(${offset}px)`;
        if (!animate) setTimeout(() => this.track.style.transition = 'transform 0.5s cubic-bezier(0.4,0,0.2,1)', 50);
    }
    
    goToSlide(i) { 
        this.currentIndex = i; 
        this.updateTrackPosition(true); 
        this.updateDots(); 
    }
    
    prev() { 
        this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.totalItems - 1; 
        this.updateTrackPosition(true); 
        this.updateDots(); 
    }
    
    next() { 
        this.currentIndex = this.currentIndex < this.totalItems - 1 ? this.currentIndex + 1 : 0; 
        this.updateTrackPosition(true); 
        this.updateDots(); 
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lenis smooth scrolling
    lenis = new Lenis({ 
        duration: 1.2, 
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
        smoothWheel: true, 
        touchMultiplier: 1.5 
    });
    
    function raf(time) { 
        lenis.raf(time); 
        requestAnimationFrame(raf); 
    }
    requestAnimationFrame(raf);
    
    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    
    // Hero Canvas Animation
    const canvas = document.getElementById('heroCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        function resizeCanvas() { 
            canvas.width = window.innerWidth; 
            canvas.height = window.innerHeight; 
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        let particles = [];
        for (let i = 0; i < 120; i++) {
            particles.push({ 
                x: Math.random() * canvas.width, 
                y: Math.random() * canvas.height, 
                radius: Math.random() * 2 + 1, 
                speedX: (Math.random() - 0.5) * 0.4, 
                speedY: (Math.random() - 0.5) * 0.3, 
                opacity: Math.random() * 0.4 + 0.2 
            });
        }
        
        function animateParticles() {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                ctx.beginPath(); 
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(212,175,55,${p.opacity})`; 
                ctx.fill();
                p.x += p.speedX; 
                p.y += p.speedY;
                if (p.x < 0) p.x = canvas.width; 
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height; 
                if (p.y > canvas.height) p.y = 0;
            });
            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }
    
    // Hero animations
    const heroTitleSpans = document.querySelectorAll('.hero-title span');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroButtons = document.querySelectorAll('.hero-content .btn-gold');
    
    gsap.set(heroTitleSpans, { y: 80, opacity: 0 });
    gsap.set(heroSubtitle, { y: 50, opacity: 0 });
    gsap.set(heroButtons, { y: 40, opacity: 0 });
    
    gsap.to(heroTitleSpans, { y: 0, opacity: 1, duration: 0.9, stagger: 0.2, ease: "power3.out", delay: 0.3 });
    gsap.to(heroSubtitle, { y: 0, opacity: 1, duration: 0.8, delay: 0.8, ease: "power3.out" });
    gsap.to(heroButtons, { y: 0, opacity: 1, duration: 0.7, stagger: 0.15, delay: 1.0, ease: "back.out(0.6)" });
    
    // ScrollTrigger animations
    gsap.to("#heroCanvas", { y: 200, ease: "none", scrollTrigger: { trigger: "#home", start: "top top", end: "bottom top", scrub: 1.2 } });
    gsap.to(".hero-content", { y: 120, opacity: 0, ease: "none", scrollTrigger: { trigger: "#home", start: "top top", end: "bottom top", scrub: 1 } });
    
    gsap.fromTo("#collections h2, #collections .w-20, #collections p", 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, scrollTrigger: { trigger: "#collections", start: "top 85%" } });
    
    gsap.fromTo("#bestsellers h2, #bestsellers .w-20, #bestsellers p", 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, scrollTrigger: { trigger: "#bestsellers", start: "top 85%" } });
    
    gsap.fromTo("#testimonials h2, #testimonials .w-20, #testimonials p", 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, scrollTrigger: { trigger: "#testimonials", start: "top 85%" } });
    
    gsap.fromTo(".glass-card", 
        { y: 60, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.12, scrollTrigger: { trigger: "#testimonials", start: "top 80%" } });
    
    // Carousel Data
    const collectionsData = [
        { name: "CLASSIC ESSENTIALS", desc: "Timeless pieces that you can never go wrong with", price: "$229", image: "https://images.unsplash.com/photo-1713881587420-113c1c43e28a?w=400&h=500&fit=crop" },
        { name: "LUXURY EDITION",     desc: "Premium fabrics with exclusive designs",    price: "$999", image: "https://plus.unsplash.com/premium_photo-1661308219954-a8035fbeb546?w=400&h=500&fit=crop" },
        { name: "SUMMER BREEZE",      desc: "Lightweight comfort for warm days",         price: "$149", image: "https://images.unsplash.com/photo-1778671394516-8270eac13c42?q=80&w=400&h=500&fit=crop" },
        { name: "LIMITED EDITION",    desc: "Exclusive drops for true connoisseurs",     price: "$349", image: "https://images.unsplash.com/photo-1631541909061-71e349d1f203?q=80&w=400&h=500&fit=crop" }
    ];
    
    const bestsellersData = [
        { name: "BLUE DOT OXFORD", desc: "Mother of pearl buttons made with premium Egyptian cotton", price: "$249", rating: 5,   reviews: "2,384", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400&h=500&fit=crop" },
        { name: "URBAN PONCHO",  desc: "Lightweight outerwear with a clean silhouette", price: "$449", rating: 4.5, reviews: "1,892", image: "https://plus.unsplash.com/premium_photo-1747763002786-a7a4e92138b1?q=80&w=400&h=500&fit=crop" },
        { name: "TAILORED SILK COAT", desc: "Expertly tailored, structured and assembled. Timeless elegance", price: "$899", rating: 5, reviews: "1,456", image: "https://plus.unsplash.com/premium_photo-1675186049297-035b3f692c04?q=80&w=400&h=500&fit=crop" },
        { name: "ESSENTIAL WOOL", desc: "Premium wool jacket for daily comfort", price: "$349", rating: 4, reviews: "987", image: "https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?q=80&w=400&h=500&fit=crop" }
    ];
    
    // Initialize carousels
    new InfiniteCarousel('collectionsTrack', collectionsData, 'collectionsDots', 'collectionsPrev', 'collectionsNext', false);
    new InfiniteCarousel('bestsellersTrack', bestsellersData, 'bestsellersDots', 'bestsellersPrev', 'bestsellersNext', true);
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('bg-black/90', 'backdrop-blur-md');
            } else {
                navbar.classList.remove('bg-black/90', 'backdrop-blur-md');
            }
        }
    });
    
    // Navigation buttons
    const shopNowBtn = document.getElementById('shopNowBtn');
    const exploreBtn = document.getElementById('exploreCollectionBtn');
    
    if (shopNowBtn) {
        shopNowBtn.addEventListener('click', () => {
            gsap.to("#shopNowBtn", { scale: 1.1, duration: 0.15, yoyo: true, repeat: 1 });
            const bestsellersSection = document.getElementById('bestsellers');
            if (bestsellersSection && lenis) lenis.scrollTo(bestsellersSection, { offset: 0 });
        });
    }
    
    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
            const collectionsSection = document.getElementById('collections');
            if (collectionsSection && lenis) lenis.scrollTo(collectionsSection, { offset: 0 });
        });
    }
    
    // Fix broken images
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() { 
            this.src = 'https://via.placeholder.com/400x500/1a1a1a/d4af37?text=SAINT'; 
        });
    });
    
    // Load cart from localStorage
    cart = JSON.parse(localStorage.getItem('saint_cart') || '[]');
    appliedPromo = JSON.parse(localStorage.getItem('saint_promo') || 'null');
    
    // Restore promo UI if already applied
    if (appliedPromo) {
        const promoInput = document.getElementById('promoInput');
        const promoApplyBtn = document.getElementById('promoApplyBtn');
        const promoMsg = document.getElementById('promoMsg');
        if (promoInput) promoInput.disabled = true;
        if (promoApplyBtn) {
            promoApplyBtn.disabled = true;
            promoApplyBtn.style.opacity = '0.5';
        }
        if (promoMsg) {
            promoMsg.className = 'promo-msg success';
            promoMsg.textContent = `✓ Code "${appliedPromo.code}" applied — 50% off!`;
        }
    }
    
    // Cart event listeners
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartNavIcon = document.getElementById('cartNavIcon');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const promoApplyBtn = document.getElementById('promoApplyBtn');
    
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
    if (cartNavIcon) cartNavIcon.addEventListener('click', openCart);
    if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckout);
    
    if (promoApplyBtn) {
        promoApplyBtn.addEventListener('click', () => {
            const input = document.getElementById('promoInput');
            const msg = document.getElementById('promoMsg');
            if (!input || !msg) return;
            
            const code = input.value.trim().toUpperCase();
            if (!code) {
                msg.className = 'promo-msg error';
                msg.textContent = 'Please enter a promo code.';
                return;
            }
            if (appliedPromo) {
                msg.className = 'promo-msg error';
                msg.textContent = 'A promo code is already applied.';
                return;
            }
            if (PROMO_CODES[code] !== undefined) {
                appliedPromo = { code, rate: PROMO_CODES[code] };
                savePromo();
                msg.className = 'promo-msg success';
                msg.textContent = `✓ Code "${code}" applied — 50% off!`;
                input.value = '';
                input.disabled = true;
                promoApplyBtn.disabled = true;
                promoApplyBtn.style.opacity = '0.5';
                updateSummary();
            } else {
                msg.className = 'promo-msg error';
                msg.textContent = 'Invalid promo code. Try DISCOUNT50.';
            }
        });
    }
    
    // Add to cart event delegation
    document.body.addEventListener('click', function(e) {
        const btn = e.target.closest('[data-add-to-cart]');
        if (!btn) return;
        const card = btn.closest('[data-product-name]');
        if (!card) return;
        const name = card.dataset.productName;
        const price = card.dataset.productPrice;
        const image = card.dataset.productImage;
        if (name && price && image) {
            window.CartSystem.addItem(name, price, image);
        }
    });
    
    // Close checkout on backdrop click
    const checkoutBackdrop = document.getElementById('checkoutBackdrop');
    if (checkoutBackdrop) checkoutBackdrop.addEventListener('click', closeCheckout);
    
    // Initial render
    renderCart();
    updateBadge();
    
    // Loading overlay fade out
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 600);
        }, 800);
    }
});

(function injectResponsiveCSS() {
    const style = document.createElement('style');
    style.textContent = `
        @media (max-width: 640px) {
            .checkout-grid { grid-template-columns: 1fr !important; }
            .confirm-grid  { grid-template-columns: 1fr !important; }
        }
    `;
    document.head.appendChild(style);
})();