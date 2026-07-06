function getProductIdFromUrl() {
  return new URLSearchParams(window.location.search).get("id");
}

function getCart() {
  return JSON.parse(localStorage.getItem("dropiCart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("dropiCart", JSON.stringify(cart));
}

function addProductToCart(product) {
  if (typeof addToCart === "function") {
    addToCart(product);
  }

  document.getElementById("productActionMessage").innerHTML =
    '<div class="alert alert-success">Added to cart successfully.</div>';
}

function buyNowProduct(product) {
  if (typeof addToCart === "function") {
    addToCart(product);
  }

  document.getElementById("productActionMessage").innerHTML =
    '<div class="alert alert-info">Ready to checkout with this product.</div>';
}

function renderProductDetail(product) {
  const container = document.getElementById("productDetail");
  if (!container) return;

  const priceHtml = product.salePrice
    ? `<span class="fs-3 fw-bold">${product.salePrice.toLocaleString()} EGP</span>
       <span class="text-white-50 ms-3 text-decoration-line-through">${product.price.toLocaleString()} EGP</span>`
    : `<span class="fs-3 fw-bold">${product.price.toLocaleString()} EGP</span>`;

  container.innerHTML = `
    <div class="col-lg-6 mb-4">
      <img id="productImage" class="img-fluid rounded-4 product-details-image" src="${product.image}" alt="${product.name}" />
    </div>
    <div class="col-lg-6">
      <h1 id="productName" class="mb-3">${product.name}</h1>
      <p id="productCategory" class="text-secondary mb-3">${product.category}</p>
      <div class="product-pricing mb-4">${priceHtml}</div>
      <p id="productDescription" class="mb-4">${product.description}</p>
      <div class="product-status mb-4">
        <span class="badge ${product.status === "Sale" ? "bg-danger" : "bg-secondary"}">
          ${product.status}
        </span>
      </div>
      <div class="d-flex gap-3 product-actions">
        <button id="addToCartBtn" class="btn btn-outline-light">Add to Cart</button>
        <button id="buyNowBtn" class="btn btn-light text-dark">Buy Now</button>
      </div>
    </div>
  `;

  document.getElementById("addToCartBtn").addEventListener("click", () => {
    addProductToCart(product);
  });

  document.getElementById("buyNowBtn").addEventListener("click", () => {
    buyNowProduct(product);
  });
}

function showProductNotFound() {
  const container = document.getElementById("productDetail");
  if (!container) return;

  container.innerHTML = `
    <div class="col-12">
      <div class="alert alert-danger">
        Product not found. Please return to the <a href="index.html" class="alert-link">shop page</a>.
      </div>
    </div>
  `;
}

(async function initProductPage() {
  const productId = getProductIdFromUrl();
  if (!productId || typeof getProductById !== "function") {
    showProductNotFound();
    return;
  }

  const product = await getProductById(productId);
  if (!product) {
    showProductNotFound();
    return;
  }
  renderProductDetail(product);
})();
