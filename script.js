const cartBtn = document.getElementById('cartBtn');
const cartOverlay = document.getElementById('cartOverlay');
const checkoutOverlay = document.getElementById('checkoutOverlay');
const comingSoonOverlay = document.getElementById('comingSoonOverlay');
const promoOverlay = document.getElementById('promoOverlay');
const toastEl = document.getElementById('toast');
const cursor = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');

let cart = [];
let activePayment = 'dana';
let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

function getSessionId() {
  let sessionId = sessionStorage.getItem('escoffierSessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('escoffierSessionId', sessionId);
  }
  return sessionId;
}

function hasSeenPromoInSession() {
  return sessionStorage.getItem('promoShownInSession') === 'true';
}

function markPromoSeenInSession() {
  sessionStorage.setItem('promoShownInSession', 'true');
}

function saveCart() {
  localStorage.setItem('escoffierCart', JSON.stringify(cart));
}

function loadCart() {
  const saved = localStorage.getItem('escoffierCart');
  if (saved) {
    try {
      cart = JSON.parse(saved);
    } catch (e) {
      cart = [];
    }
  }
}

function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2600);
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function renderCart() {
  const container = document.getElementById('cartItems');
  const totalRow = document.getElementById('cartTotalRow');
  const actions = document.getElementById('cartActions');
  if (!container || !totalRow || !actions) return;

  if (cart.length === 0) {
    container.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    totalRow.style.display = 'none';
    actions.style.display = 'none';
  } else {
    container.innerHTML = '';
    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${item.img}" alt="${item.name}" onerror="this.style.display='none'" />
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">$${item.price.toFixed(2)} x ${item.qty}</div>
        </div>
        <div class="cart-qty">
          <button class="qty-btn" type="button" onclick="changeQty('${item.id}', -1)">-</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" type="button" onclick="changeQty('${item.id}', 1)">+</button>
        </div>
        <button class="cart-item-remove" type="button" onclick="removeItem('${item.id}')">Remove</button>
      `;
      container.appendChild(row);
    });
    totalRow.style.display = 'flex';
    actions.style.display = 'flex';
    document.getElementById('cartTotal').textContent = '$' + getCartTotal().toFixed(2);
  }
}

function findCartItem(id) {
  return cart.find(item => item.id === id);
}

function generateId(name, price) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.round(price * 100)}`;
}

function addToCart(name, price, img) {
  const id = generateId(name, price);
  const existing = findCartItem(id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price, img, qty: 1 });
  }
  saveCart();
  updateCartCount();
  renderCart();
  showToast(`Added ${name} to cart!`);
}

function changeQty(id, delta) {
  const item = findCartItem(id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  saveCart();
  updateCartCount();
  renderCart();
}

function removeItem(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartCount();
  renderCart();
  showToast('Item removed from cart.');
}

function openCart() {
  if (!cartOverlay) return;
  cartOverlay.classList.add('active');
  document.body.classList.add('popup-open');
}

function closeCart() {
  if (!cartOverlay) return;
  cartOverlay.classList.remove('active');
  document.body.classList.remove('popup-open');
}

function openCheckout() {
  if (cart.length === 0) {
    showToast('Your cart is empty. Add something first.');
    return;
  }
  if (!checkoutOverlay) return;
  fillCheckoutPreview();
  checkoutOverlay.classList.add('active');
  document.body.classList.add('popup-open');
  closeCart();
}

function closeCheckout() {
  if (!checkoutOverlay) return;
  checkoutOverlay.classList.remove('active');
  document.body.classList.remove('popup-open');
}

function selectPayment(method) {
  activePayment = method;
  document.querySelectorAll('.pay-opt').forEach(button => {
    button.classList.toggle('active', button.id === `pay${method.charAt(0).toUpperCase() + method.slice(1)}`);
  });
  if (method === 'bank') {
    openComingSoon();
  }
}

function fillCheckoutPreview() {
  const preview = document.getElementById('checkoutPreview');
  const totalEl = document.getElementById('checkoutTotal');
  if (!preview || !totalEl) return;
  preview.innerHTML = '';
  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'checkout-preview-item';
    row.innerHTML = `<span>${item.name} x${item.qty}</span><span>$${(item.price * item.qty).toFixed(2)}</span>`;
    preview.appendChild(row);
  });
  totalEl.textContent = '$' + getCartTotal().toFixed(2);
}

function openComingSoon() {
  if (!comingSoonOverlay) return;
  comingSoonOverlay.classList.add('active');
  document.body.classList.add('popup-open');
}

function closeComingSoon() {
  if (!comingSoonOverlay) return;
  comingSoonOverlay.classList.remove('active');
  document.body.classList.remove('popup-open');
}

function openPromo() {
  if (!promoOverlay) return;
  promoOverlay.classList.add('active');
  document.body.classList.add('popup-open');
  window.clearTimeout(openPromo.autoCloseTimeout);
  openPromo.autoCloseTimeout = window.setTimeout(() => {
    closePromo();
  }, 7000);
}

function closePromo() {
  if (!promoOverlay) return;
  window.clearTimeout(openPromo.autoCloseTimeout);
  promoOverlay.classList.remove('active');
  document.body.classList.remove('popup-open');
}

function grabDeal() {
  addToCart('Delicious La Lettre à Focalors', 5, 'assets/delicious-la-lettre-a-focalors.png');
  addToCart('Delicious Pâte de Fruit', 5, 'assets/delicious-pate-de-fruit.png');
  closePromo();
  openCart();
  showToast('Promo deal added to your cart!');
}

function processBuy() {
  const email = document.getElementById('checkoutEmail')?.value?.trim();
  const phone = document.getElementById('checkoutPhone')?.value?.trim();
  const address = document.getElementById('checkoutAddress')?.value?.trim();
  if (!email || !phone || !address) {
    showToast('Please complete all checkout details first.');
    return;
  }
  const orderData = {
    items: cart,
    total: getCartTotal(),
    email,
    phone,
    address,
    payment: activePayment
  };
  sessionStorage.setItem('orderData', JSON.stringify(orderData));
  closeCheckout();
  openPromo();
  window.setTimeout(() => {
    window.location.href = 'qrpay.html';
  }, 2800);
}

function initAos() {
  const elements = document.querySelectorAll('[data-aos]');
  if (!elements.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('aos-animate');
      }
    });
  }, { threshold: 0.2 });
  elements.forEach(el => observer.observe(el));
}

function initCursor() {
  if (!cursor || !follower) return;
  document.addEventListener('mousemove', event => {
    targetX = event.clientX;
    targetY = event.clientY;
    cursor.style.left = `${targetX}px`;
    cursor.style.top = `${targetY}px`;
    cursor.style.opacity = '1';
    follower.style.opacity = '.5';
  });

  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    follower.style.opacity = '0';
  });

  const floatFollower = () => {
    currentX += (targetX - currentX) * 0.16;
    currentY += (targetY - currentY) * 0.16;
    follower.style.left = `${currentX}px`;
    follower.style.top = `${currentY}px`;
    requestAnimationFrame(floatFollower);
  };
  requestAnimationFrame(floatFollower);

  document.body.addEventListener('mouseover', event => {
    if (event.target.closest('a, button, .add-cart-btn, .nav-link, .pay-opt, .popup-close')) {
      document.body.classList.add('cursor-hover');
    }
  });

  document.body.addEventListener('mouseout', event => {
    if (event.target.closest('a, button, .add-cart-btn, .nav-link, .pay-opt, .popup-close')) {
      const stillHovered = [...document.querySelectorAll('a:hover, button:hover, .add-cart-btn:hover, .nav-link:hover, .pay-opt:hover, .popup-close:hover')].length > 0;
      if (!stillHovered) {
        document.body.classList.remove('cursor-hover');
      }
    }
  });
}

function initInteractions() {
  loadCart();
  if (cartBtn) {
    cartBtn.addEventListener('click', openCart);
  }
  initAos();
  initCursor();
  updateCartCount();
  renderCart();

  let promoShownOnScroll = false;
  window.addEventListener('scroll', () => {
    if (!promoShownOnScroll && !hasSeenPromoInSession()) {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent >= 70) {
        openPromo();
        markPromoSeenInSession();
        promoShownOnScroll = true;
      }
    }
  }, { passive: true });
}

window.addEventListener('DOMContentLoaded', initInteractions);

window.addToCart = addToCart;
window.changeQty = changeQty;
window.removeItem = removeItem;
window.openCart = openCart;
window.closeCart = closeCart;
window.openCheckout = openCheckout;
window.closeCheckout = closeCheckout;
window.selectPayment = selectPayment;
window.closeComingSoon = closeComingSoon;
window.openPromo = openPromo;
window.closePromo = closePromo;
window.grabDeal = grabDeal;
window.processBuy = processBuy;
window.goBack = window.goBack || (() => window.history.back());
