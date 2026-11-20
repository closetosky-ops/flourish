(function () {
  'use strict';
  const products = {
    sourwood: { name: 'Sourwood', price: 18 },
    wildflower: { name: 'Wildflower', price: 16 },
    honeycomb: { name: 'Honeycomb', price: 22 }
  };
  let basket = {};
  try {
    const stored = JSON.parse(localStorage.getItem('flourish-basket') || '{}');
    Object.keys(products).forEach(id => { const n = Number(stored[id]); if (Number.isInteger(n) && n > 0) basket[id] = Math.min(n, 99); });
  } catch (_) { /* Basket also works without browser storage. */ }
  const cart = document.getElementById('cart');
  const checkout = document.getElementById('checkout');
  const items = document.getElementById('cart-items');
  const subtotal = document.getElementById('cart-subtotal');
  const checkoutButton = document.getElementById('checkout-button');
  const toast = document.getElementById('toast');
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-menu');
  let toastTimer;
  const money = value => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD'}).format(value);
  const total = () => Object.entries(basket).reduce((sum, [id, quantity]) => sum + products[id].price * quantity, 0);

  function announce(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2400);
  }
  function save() { try { localStorage.setItem('flourish-basket', JSON.stringify(basket)); } catch (_) {} }
  function renderBasket() {
    const count = Object.values(basket).reduce((sum, quantity) => sum + quantity, 0);
    document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = count; });
    document.querySelectorAll('[data-open-cart]').forEach(el => { el.setAttribute('aria-label', `Open basket, ${count} ${count === 1 ? 'item' : 'items'}`); });
    items.replaceChildren();
    if (!count) {
      const empty = document.createElement('p'); empty.className = 'empty-cart'; empty.textContent = 'Your basket is waiting for a little sweetness. Explore the sample collection to find your favorite.'; items.append(empty);
    }
    Object.entries(basket).forEach(([id, quantity]) => {
      const product = products[id];
      const item = document.createElement('article'); item.className = 'cart-item';
      item.innerHTML = `<div><h3>${product.name}</h3><small>12 oz · ${money(product.price)} each · Sample</small><div class="quantity"><button type="button" data-quantity="-1" data-id="${id}" aria-label="Decrease ${product.name} quantity">−</button><span aria-live="polite">${quantity}</span><button type="button" data-quantity="1" data-id="${id}" aria-label="Increase ${product.name} quantity" ${quantity >= 99 ? 'disabled' : ''}>+</button></div></div><span class="item-total">${money(product.price * quantity)}</span>`;
      items.append(item);
    });
    subtotal.textContent = money(total());
    checkoutButton.disabled = !count;
  }
  function syncModalState() { document.body.classList.toggle('modal-open', cart.open || checkout.open); }
  document.querySelectorAll('[data-add]').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.add;
      if ((basket[id] || 0) >= 99) { announce('Your basket already has 99 of this item.'); return; }
      basket[id] = (basket[id] || 0) + 1; save(); renderBasket(); announce(`${products[id].name} added to your basket.`);
    });
  });
  items.addEventListener('click', event => {
    const button = event.target.closest('[data-quantity]');
    if (!button) return;
    const id = button.dataset.id;
    const previousRow = Array.from(items.children).indexOf(button.closest('.cart-item'));
    basket[id] = Math.min(99, (basket[id] || 0) + Number(button.dataset.quantity));
    const removed = basket[id] <= 0;
    if (removed) delete basket[id];
    const direction = button.dataset.quantity;
    save(); renderBasket();
    // Restore keyboard focus after replacing the quantity controls.
    const replacement = items.querySelector(`[data-id="${id}"][data-quantity="${direction}"]:not(:disabled)`) || items.querySelector(`[data-id="${id}"][data-quantity]:not(:disabled)`) || items.children[Math.max(0, previousRow - 1)]?.querySelector('button') || document.querySelector('[data-close-cart]');
    replacement?.focus({preventScroll:true});
    if (removed) announce(`${products[id].name} removed from your basket.`);
  });
  document.querySelectorAll('[data-open-cart]').forEach(button => button.addEventListener('click', () => { cart.showModal(); syncModalState(); }));
  document.querySelectorAll('[data-close-cart]').forEach(button => button.addEventListener('click', () => cart.close()));
  document.querySelectorAll('[data-close-checkout]').forEach(button => button.addEventListener('click', () => checkout.close()));
  checkoutButton.addEventListener('click', () => { document.getElementById('checkout-total').textContent = money(total()); checkout.showModal(); syncModalState(); });
  [cart, checkout].forEach(dialog => {
    dialog.addEventListener('close', syncModalState);
    dialog.addEventListener('click', event => { const rect = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close(); });
  });
  function closeMenu() { menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open menu'); }
  menuButton.addEventListener('click', () => { const open = menu.hidden; menu.hidden = !open; menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { closeMenu(); menuButton.focus(); } });
  document.addEventListener('click', event => { if (!menu.hidden && !event.target.closest('.site-header')) closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 980) closeMenu(); }, {passive:true});
  document.getElementById('year').textContent = new Date().getFullYear();
  renderBasket();
})();
