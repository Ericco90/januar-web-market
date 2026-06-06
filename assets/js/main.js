// File: assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
  loadCommonElements();
});

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

// Wishlist Management
function toggleWishlist(productId) {
  let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  const index = wishlist.indexOf(productId);
  
  if (index === -1) {
    wishlist.push(productId);
    alert('Added to wishlist');
  } else {
    wishlist.splice(index, 1);
    alert('Removed from wishlist');
  }
  
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  updateWishlistUI();
}

function updateWishlistUI() {
  // Update icons if product is in wishlist
}
