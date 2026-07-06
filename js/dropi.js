const container = document.getElementById("catContainer");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const featuredContainer = document.getElementById("featuredProducts");

const card = document.querySelector(".category");
const scrollStep = card ? card.offsetWidth + 16 : 200;

function updateArrows() {
  if (!container || !leftBtn || !rightBtn) return;

  const maxScrollLeft = container.scrollWidth - container.clientWidth;

  if (container.scrollLeft <= 0) {
    leftBtn.style.opacity = "0";
    leftBtn.style.pointerEvents = "none";
  } else {
    leftBtn.style.opacity = "1";
    leftBtn.style.pointerEvents = "auto";
  }

  if (container.scrollLeft >= maxScrollLeft - 1) {
    rightBtn.style.opacity = "0";
    rightBtn.style.pointerEvents = "none";
  } else {
    rightBtn.style.opacity = "1";
    rightBtn.style.pointerEvents = "auto";
  }
}

if (container && leftBtn && rightBtn) {
  rightBtn.onclick = () => {
    container.scrollBy({
      left: scrollStep,
      behavior: "smooth",
    });
  };

  leftBtn.onclick = () => {
    container.scrollBy({
      left: -scrollStep,
      behavior: "smooth",
    });
  };

  container.addEventListener("scroll", updateArrows);
  window.addEventListener("resize", updateArrows);
  updateArrows();
}

let searchCache = null;

async function loadSearchProducts() {
  if (searchCache) return searchCache;
  if (typeof fetchProducts === "function") {
    searchCache = await fetchProducts();
  } else if (typeof loadProducts === "function") {
    searchCache = await loadProducts();
  } else {
    searchCache = [];
  }
  return searchCache;
}

function closeSearchOverlay(searchBar, searchInput, searchResults) {
  if (!searchBar || !searchInput) return;
  searchInput.classList.remove("show");
  searchBar.classList.add("d-none");
  searchInput.value = "";
  if (searchResults) {
    searchResults.innerHTML = "";
  }
}

function renderSearchResults(items, searchResults) {
  if (!searchResults) return;
  if (!items.length) {
    searchResults.innerHTML =
      '<div class="search-no-results">No products found. Try another term.</div>';
    return;
  }

  searchResults.innerHTML = items
    .map(
      (product) => `
        <a href="product.html?id=${product.id}" class="search-result-item">
          <h6>${product.name}</h6>
          <small>${product.category} · ${formatPrice(product.salePrice || product.price)}</small>
        </a>
      `,
    )
    .join("");
}

async function performSearch(query, searchResults) {
  if (!query) {
    if (searchResults) searchResults.innerHTML = "";
    return;
  }

  const products = await loadSearchProducts();
  const normalized = query.trim().toLowerCase();
  const results = products.filter((product) => {
    const text =
      `${product.name} ${product.category} ${product.description}`.toLowerCase();
    return text.includes(normalized);
  });

  renderSearchResults(results.slice(0, 8), searchResults);
}

function initializeSearchOverlay() {
  const searchBar = document.getElementById("searchOverlay");
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  document.body.addEventListener("click", async (event) => {
    const icon = event.target.closest("#searchIcon");
    if (icon) {
      event.preventDefault();
      const searchBarElement = document.getElementById("searchOverlay");
      const searchInputElement = document.getElementById("searchInput");
      if (!searchBarElement || !searchInputElement) return;

      searchBarElement.classList.remove("d-none");
      await loadSearchProducts();
      setTimeout(() => {
        searchInputElement.classList.add("show");
        searchInputElement.focus();
      }, 10);
      return;
    }

    const overlay = event.target.closest("#searchOverlay");
    if (overlay && event.target === overlay) {
      closeSearchOverlay(overlay, searchInput, searchResults);
    }
  });

  document.body.addEventListener("input", (event) => {
    const target = event.target;
    if (target && target.id === "searchInput") {
      performSearch(target.value, searchResults);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const searchBarElement = document.getElementById("searchOverlay");
      const searchInputElement = document.getElementById("searchInput");
      const searchResultsElement = document.getElementById("searchResults");
      if (searchBarElement && !searchBarElement.classList.contains("d-none")) {
        closeSearchOverlay(
          searchBarElement,
          searchInputElement,
          searchResultsElement,
        );
      }
    }
  });
}

window.initializeSearchOverlay = initializeSearchOverlay;

function formatPrice(amount) {
  return `${amount.toLocaleString()} EGP`;
}

function createFeaturedCard(product) {
  const badgeClass = product.status === "Sale" ? "bg-danger" : "bg-dark";
  const badgeText = product.status || "";
  const hasSale = product.salePrice && product.salePrice < product.price;
  const priceHtml = hasSale
    ? `<span class="d-inline sale-price card-text text-light text-white-50">${formatPrice(product.price)}</span> <span class="d-inline main-price card-text text-light">${formatPrice(product.salePrice)}</span>`
    : `<span class="d-inline main-price card-text text-light">${formatPrice(product.price)}</span>`;

  return `
    <div class="mt-2 card col-lg-3 col-md-4 col-sm-6">
      <div class="position-relative">
        <a href="product.html?id=${product.id}">
          <img src="${product.image}" class="card-img-top" alt="${product.name}" />
        </a>
        <span class="badge ${badgeClass} position-absolute top-0 end-0 m-2">${badgeText}</span>
      </div>
      <div class="card-body text-center">
        <a href="product.html?id=${product.id}" class="card-title text-light">${product.name}</a>
        <div class="card-prices py-2">${priceHtml}</div>
      </div>
    </div>
  `;
}

function renderFeaturedProducts(featuredProducts) {
  if (!featuredContainer || !Array.isArray(featuredProducts)) return;
  featuredContainer.innerHTML = featuredProducts
    .map(createFeaturedCard)
    .join("");
}

function getCart() {
  return JSON.parse(localStorage.getItem("dropiCart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("dropiCart", JSON.stringify(cart));
}

function calculateCartTotal(cart) {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function updateCartCount() {
  const cartCount = document.getElementById("cartCount");
  if (!cartCount) return;
  const cart = getCart();
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalQuantity;
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");
  if (!cartItems || !cartTotal) return;

  const cart = getCart();
  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="text-light">Your cart is empty.</p>';
    cartTotal.textContent = "0 EGP";
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item d-flex justify-content-between align-items-center mb-3">
          <div>
            <h6 class="mb-1 text-light">${item.name}</h6>
            <p class="mb-1 text-secondary">${item.quantity} × ${formatPrice(item.price)}</p>
            <p class="mb-0 text-light">${formatPrice(item.price * item.quantity)}</p>
          </div>
          <button data-id="${item.id}" class="btn btn-sm btn-outline-light remove-cart-item">Remove</button>
        </div>
      `,
    )
    .join("");

  cartTotal.textContent = formatPrice(calculateCartTotal(cart));

  document.querySelectorAll(".remove-cart-item").forEach((button) => {
    button.addEventListener("click", () => {
      const itemId = button.getAttribute("data-id");
      removeFromCart(itemId);
    });
  });
}

function openCart() {
  const cartOverlay = document.getElementById("cartOverlay");
  if (!cartOverlay) return;
  renderCart();
  updateCartCount();
  cartOverlay.classList.remove("d-none");
}

function closeCart() {
  const cartOverlay = document.getElementById("cartOverlay");
  if (!cartOverlay) return;
  cartOverlay.classList.add("d-none");
}

function removeFromCart(productId) {
  const cart = getCart().filter((item) => item.id !== productId);
  saveCart(cart);
  renderCart();
  updateCartCount();
}

function setupCartEvents() {
  const cartIcon = document.getElementById("cartIcon");
  const closeCartBtn = document.getElementById("closeCartBtn");
  const checkoutBtn = document.getElementById("checkoutBtn");

  if (cartIcon) {
    cartIcon.addEventListener("click", (event) => {
      event.preventDefault();
      openCart();
    });
  }

  if (closeCartBtn) {
    closeCartBtn.addEventListener("click", closeCart);
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      window.location.href = "product.html";
    });
  }
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.salePrice || product.price,
      quantity: 1,
    });
  }

  saveCart(cart);
  updateCartCount();
}

function initializeCart() {
  updateCartCount();
  setupCartEvents();
}

window.initializeCart = initializeCart;
window.addToCart = addToCart;
window.openCart = openCart;
window.closeCart = closeCart;

async function initProducts() {
  if (typeof getFeaturedProducts !== "function") return;
  const featuredProducts = await getFeaturedProducts();
  if (featuredContainer) {
    renderFeaturedProducts(featuredProducts);
  }
}

if (typeof getFeaturedProducts === "function") {
  initProducts();
}
