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
  sessionStorage.setItem("dropiBuyNowItem", JSON.stringify(product));
  window.location.href = "checkout.html?mode=buy-now";
}

function validateProductSelection(product, selectedColor, selectedSize) {
  const missingColor = product.colors?.length > 1 && !selectedColor;
  const missingSize = product.sizes?.length > 0 && !selectedSize;
  if (!missingColor && !missingSize) return true;

  const missingOptions = [
    missingColor && "color",
    missingSize && "size",
  ].filter(Boolean);
  document.getElementById("productActionMessage").innerHTML =
    `<div class="alert alert-warning">Please choose a ${missingOptions.join(" and ")} before continuing.</div>`;
  return false;
}

function getAvailableProductStock(product, selectedColor, selectedSize) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (!variants.length) return Math.max(0, Number(product.stock) || 0);

  return variants.reduce((total, variant) => {
    const variantColor = String(variant.color || "").trim().toLowerCase();
    const variantSize = String(variant.size || "").trim().toLowerCase();
    if (
      selectedColor &&
      variantColor &&
      variantColor !== selectedColor.trim().toLowerCase()
    ) {
      return total;
    }
    if (
      selectedSize &&
      variantSize &&
      variantSize !== selectedSize.trim().toLowerCase()
    ) {
      return total;
    }
    return total + Math.max(0, Number(variant.stock) || 0);
  }, 0);
}

function updateProductActions(product, selectedColor, selectedSize) {
  const availableStock = getAvailableProductStock(
    product,
    selectedColor,
    selectedSize,
  );
  const cartQuantity = getCart()
    .filter(
      (item) =>
        item.id === product.id &&
        (item.color || null) === selectedColor &&
        (item.size || null) === selectedSize,
    )
    .reduce((total, item) => total + Math.max(0, Number(item.quantity) || 0), 0);
  const addToCartButton = document.getElementById("addToCartBtn");
  const buyNowButton = document.getElementById("buyNowBtn");
  const outOfStock = availableStock < 1;

  addToCartButton.disabled = outOfStock || cartQuantity >= availableStock;
  buyNowButton.disabled = outOfStock;
  addToCartButton.title =
    cartQuantity >= availableStock && !outOfStock
      ? "Your cart already has all available stock."
      : "";
}

function getProductImageData(product, selectedColor) {
  const colors = Array.isArray(product.colorOptions)
    ? product.colorOptions
    : Array.isArray(product.colors)
      ? product.colors
      : [];
  const selectedOption = colors.find(
    (option) =>
      typeof option === "object" &&
      String(option.color || "").toLowerCase() ===
        String(selectedColor || "").toLowerCase(),
  );
  const imageData =
    selectedOption?.mainImage ?? product.mainImage ?? product.productImage;
  if (!imageData?.secure_url || !imageData?.public_id) return null;
  return {
    secure_url: imageData.secure_url,
    public_id: imageData.public_id,
  };
}

function renderProductDetail(product) {
  const container = document.getElementById("productDetail");
  if (!container) return;

  const badge =
    Number(product.stock) <= 0
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
          Array.isArray(product.colors) && product.colors.length > 1
            ? `<div class="mb-3"><div class="product-option-label"><label class="form-label mb-0">Color</label><span id="selectedColorName" class="selected-option-name">Choose a color</span></div><div id="colorSwatches" class="d-flex align-items-center gap-2">${product.colors
                .map(
                  (color, index) =>
                    `<button type="button" class="color-swatch" data-color="${color}" data-color-index="${index}" aria-label="${color}" aria-pressed="false" style="background:${product.colorOptions[index]?.hexCode || color}"></button>`,
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
  let selectedColor =
    product.colors?.length === 1 ? product.colors[0] : null;
  let selectedSize = null;

  const colorOptions = Array.isArray(product.colorOptions)
    ? product.colorOptions
    : [];
  const productImage = document.getElementById("productImage");
  updateProductActions(product, selectedColor, selectedSize);

  document.querySelectorAll(".color-swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".color-swatch").forEach((b) => {
        b.classList.remove("selected");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("selected");
      btn.setAttribute("aria-pressed", "true");
      selectedColor = btn.dataset.color || null;
      document.getElementById("selectedColorName").textContent =
        `Selected: ${selectedColor}`;

      const colorIndex = Number(btn.dataset.colorIndex);
      const selectedImage = colorOptions[colorIndex]?.mainImage?.secure_url;
      if (productImage && selectedImage) {
        productImage.src = selectedImage;
        productImage.alt = `${product.name} - ${selectedColor}`;
      }
      updateProductActions(product, selectedColor, selectedSize);
    });
  });

  document.querySelectorAll(".size-swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".size-swatch")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedSize = btn.dataset.size || null;
      updateProductActions(product, selectedColor, selectedSize);
    });
  });

  document.getElementById("addToCartBtn").addEventListener("click", () => {
    if (!validateProductSelection(product, selectedColor, selectedSize)) return;
    const availableStock = getAvailableProductStock(
      product,
      selectedColor,
      selectedSize,
    );
    const cartQuantity = getCart()
      .filter(
        (item) =>
          item.id === product.id &&
          (item.color || null) === selectedColor &&
          (item.size || null) === selectedSize,
      )
      .reduce(
        (total, item) => total + Math.max(0, Number(item.quantity) || 0),
        0,
      );
    if (availableStock < 1 || cartQuantity >= availableStock) {
      document.getElementById("productActionMessage").innerHTML =
        '<div class="alert alert-warning">There is not enough stock available for this selection.</div>';
      updateProductActions(product, selectedColor, selectedSize);
      return;
    }
    const item = Object.assign({}, product, {
      selectedColor,
      selectedSize,
      productImage: getProductImageData(product, selectedColor),
    });
    addProductToCart(item);
    updateProductActions(product, selectedColor, selectedSize);
  });

  document.getElementById("buyNowBtn").addEventListener("click", () => {
    if (!validateProductSelection(product, selectedColor, selectedSize)) return;
    if (getAvailableProductStock(product, selectedColor, selectedSize) < 1) {
      document.getElementById("productActionMessage").innerHTML =
        '<div class="alert alert-warning">There is not enough stock available for this selection.</div>';
      updateProductActions(product, selectedColor, selectedSize);
      return;
    }
    const item = Object.assign({}, product, {
      selectedColor,
      selectedSize,
      productImage: getProductImageData(product, selectedColor),
    });
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
