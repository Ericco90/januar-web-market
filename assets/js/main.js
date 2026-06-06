// File: assets/js/main.js



// Theme Management
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.add('dark');
    if(themeToggle) themeToggle.innerHTML = '<i class="ri-sun-line"></i>';
  }

  if(themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      themeToggle.innerHTML = isDark ? '<i class="ri-sun-line"></i>' : '<i class="ri-moon-line"></i>';
    });
  }
}

// Mobile Menu (Placeholder for future expansion)
function initMobileMenu() {
  // Can be implemented for responsive nav toggle
}

// Utils
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// UI Helpers
function showLoading(containerId) {
  const container = document.getElementById(containerId);
  if(container) {
    container.innerHTML = `
      <div class="loader-container">
        <div class="loader"></div>
      </div>
    `;
  }
}

// Load common elements like Navbar and Footer dynamically if needed
function loadCommonElements() {
  // If navbar is empty, we could populate it here to keep HTML DRY
}

// Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="ri-${type === 'success' ? 'checkbox-circle' : 'error-warning'}-line" style="color: var(--${type === 'success' ? 'primary' : 'danger'}); font-size: 1.25rem;"></i> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Shopping Cart Management
let cart = JSON.parse(localStorage.getItem('januar_cart') || '[]');

function updateCartUI() {
  const badge = document.getElementById('cart-badge');
  if (badge) badge.innerText = cart.length;

  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotalPrice = document.getElementById('cart-total-price');
  
  if (!cartItemsContainer || !cartTotalPrice) return;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<div style="text-align:center; color: var(--text-muted); margin-top: 2rem;">Keranjang Anda kosong</div>';
    cartTotalPrice.innerText = 'Rp 0';
    return;
  }

  let total = 0;
  cartItemsContainer.innerHTML = cart.map(item => {
    total += parseInt(item.price);
    return `
      <div class="cart-item">
        <img src="${item.thumbnail || 'https://via.placeholder.com/70'}" alt="${item.name}">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">${formatRupiah(item.price)}</div>
          <span class="cart-item-remove" onclick="removeFromCart('${item.id}')"><i class="ri-delete-bin-line"></i> Hapus</span>
        </div>
      </div>
    `;
  }).join('');
  
  cartTotalPrice.innerText = formatRupiah(total);
}

function toggleCart() {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  if(sidebar) sidebar.classList.toggle('active');
  if(overlay) overlay.classList.toggle('active');
  updateCartUI();
}

function addToCart(id, name, price, thumbnail) {
  if (cart.find(item => item.id === id)) {
    showToast('Produk sudah ada di keranjang', 'warning');
    return;
  }
  cart.push({ id, name, price, thumbnail });
  localStorage.setItem('januar_cart', JSON.stringify(cart));
  updateCartUI();
  showToast('Berhasil ditambahkan ke keranjang');
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  localStorage.setItem('januar_cart', JSON.stringify(cart));
  updateCartUI();
}

function checkoutCart() {
  if (cart.length === 0) {
    showToast('Keranjang masih kosong', 'warning');
    return;
  }
  window.location.href = 'checkout.html?cart=1';
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
  loadCommonElements();
  updateCartUI(); // Initialize cart UI
});
