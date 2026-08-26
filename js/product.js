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

  window.location.href = "checkout.html";
}

function renderProductDetail(product) {
  const container = document.getElementById("productDetail");
  if (!container) return;

  const badge =
    Number(product.stock) === 0
      ? { className: "bg-dark", text: "Sold Out" }
      : Number(product.discount) > 0
        ? { className: "bg-danger", text: "Sale" }
        : { className: "bg-secondary", text: product.status || "" };

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
        <span class="badge ${badge.className}">
          ${badge.text}
        </span>
      </div>
      <div class="product-options mb-4">
        ${
          Array.isArray(product.colors) && product.colors.length
            ? `<div class="mb-3"><label class="form-label">Color</label><div id="colorSwatches" class="d-flex align-items-center gap-2">${product.colors
                .map(
                  (c) =>
                    `<button type="button" class="color-swatch" data-color="${c}" aria-label="${c}" style="background:${c.toLowerCase()}"></button>`,
                )
                .join("")}</div></div>`
            : ""
        }
        ${
          Array.isArray(product.sizes) && product.sizes.length
            ? `<div class="mb-3"><label class="form-label">Size</label><div id="sizeSwatches" class="d-flex align-items-center gap-2">${product.sizes
                .map(
                  (s) =>
                    `<button type="button" class="size-swatch" data-size="${s}">${s}</button>`,
                )
                .join("")}</div></div>`
            : ""
        }
      </div>
      <div class="d-flex gap-3 product-actions">
        <button id="addToCartBtn" class="btn btn-outline-light">Add to Cart</button>
        <button id="buyNowBtn" class="btn btn-light text-dark">Buy Now</button>
      </div>
    </div>
  `;

  // interactive swatches
  let selectedColor = null;
  let selectedSize = null;

  document.querySelectorAll(".color-swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".color-swatch")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedColor = btn.dataset.color || null;
    });
  });

  document.querySelectorAll(".size-swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".size-swatch")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedSize = btn.dataset.size || null;
    });
  });

  document.getElementById("addToCartBtn").addEventListener("click", () => {
    const item = Object.assign({}, product, { selectedColor, selectedSize });
    addProductToCart(item);
  });

  document.getElementById("buyNowBtn").addEventListener("click", () => {
    const item = Object.assign({}, product, { selectedColor, selectedSize });
    buyNowProduct(item);
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
