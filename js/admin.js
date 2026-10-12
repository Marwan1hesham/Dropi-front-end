const ADMIN_PRODUCTS_KEY = "dropiAdminProducts";
const ADMIN_ORDERS_KEY = "dropiAdminOrders";
const FALLBACK_IMAGE = "../images/327+ Free T-Shirt Mockups.jfif";
const PRODUCT_STATUSES = ["sold_out", "sale", "new"];
const PRODUCT_CATEGORIES = ["crewnecks", "hoodies", "pants", "jackets"];
const ORDER_STATUSES = ["pending", "paid", "cancelled"];

if (!getAdminToken()) {
  window.location.replace("admin-login.html");
}

let products = [];
let orders = [];
let deleteTarget = null;

const formatPrice = (value) => `${Number(value || 0).toLocaleString()} EGP`;
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>'"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        char
      ],
  );

async function loadAdminData() {
  await loadAdminProducts();
  await loadAdminOrders();
}

function getProductImage(product) {
  return (
    product.image ||
    product.colors?.[0]?.mainImage?.secure_url ||
    product.mainImage?.secure_url ||
    product.mainImage?.url ||
    FALLBACK_IMAGE
  );
}

function normalizeProduct(product) {
  return { ...product, image: getProductImage(product) };
}

async function loadAdminProducts() {
  const category =
    document.getElementById("productCategoryFilter")?.value || "";
  const status = document.getElementById("productStatusFilter")?.value || "";
  const query = new URLSearchParams();
  if (category) query.set("category", category);
  if (status) query.set("status", status);

  const response = await adminFetch(
    `/admin/get-products${query.toString() ? `?${query}` : ""}`,
  );
  const result = await response.json();
  if (!response.ok || !Array.isArray(result.data)) {
    throw new Error(result.message || "Could not load products.");
  }
  products = result.data.map(normalizeProduct);
  renderStats();
  renderProducts();
}

async function loadAdminOrders() {
  const status = document.getElementById("orderStatusFilter").value;
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  const queryString = query.toString();
  const response = await adminFetch(
    `/admin/get-orders${queryString ? `?${queryString}` : ""}`,
  );
  const result = await response.json();
  const orderData = Array.isArray(result)
    ? result
    : Array.isArray(result.data)
      ? result.data
      : [];
  if (!response.ok) {
    throw new Error(result.message || "Could not load orders.");
  }
  orders = orderData.map(normalizeAdminOrder).filter(Boolean);
  renderStats();
  renderRecentOrders();
  renderOrders();
}

function normalizeAdminOrder(order) {
  const items = Array.isArray(order.items?.data)
    ? order.items.data
    : Array.isArray(order.items)
      ? order.items
      : Array.isArray(order.products)
        ? order.products
        : null;
  const fullName =
    order.fullName ||
    [order.firstName, order.lastName].filter(Boolean).join(" ").trim();
  if (order.orderNumber == null || !fullName || !items) return null;

  return {
    ...order,
    id: String(order._id ?? order.orderNumber),
    orderNumber: order.orderNumber,
    fullName,
    items,
    date: order.date ?? order.createdAt?.slice(0, 10) ?? "",
    status: String(order.status ?? "none"),
  };
}

function normalizeProductReference(value) {
  if (value == null) return "";
  if (typeof value !== "object") return String(value).trim().toLowerCase();
  if (typeof value.toHexString === "function") {
    return value.toHexString().toLowerCase();
  }
  return normalizeProductReference(
    value._id ?? value.id ?? value.$oid ?? value.oid ?? value.productId,
  );
}

function renderOrderItems(items) {
  if (!items.length) return "No items";
  return items
    .map((item) => {
      const populatedProduct =
        item.productId && typeof item.productId === "object"
          ? item.productId
          : item.product && typeof item.product === "object"
            ? item.product
            : item.data?.product;
      const name =
        item.name ??
        item.data?.name ??
        item.data?.product?.name ??
        populatedProduct?.name ??
        item.productId?.name ??
        "Item";
      const references = [
        item.productId,
        item.product_id,
        item.productID,
        item.product,
        item.product?._id,
        item.product?.id,
        item.data?.productId,
        item.data?.product?._id,
      ]
        .map(normalizeProductReference)
        .filter(Boolean);
      let catalogProduct = products.find((product) =>
        references.includes(
          normalizeProductReference(product._id ?? product.id),
        ),
      );
      if (!catalogProduct && name !== "Item") {
        const namedProducts = products.filter(
          (product) => product.name?.toLowerCase() === name.toLowerCase(),
        );
        if (namedProducts.length === 1) catalogProduct = namedProducts[0];
      }
      if (!catalogProduct && products.length === 1) {
        catalogProduct = products[0];
      }

      const detail = populatedProduct ?? item.data ?? catalogProduct ?? item;
      const displayName =
        name === "Item" ? (catalogProduct?.name ?? name) : name;
      const productDetails = [detail, catalogProduct].filter(Boolean);
      const quantity = item.quantity ?? detail.quantity;
      const colors = productDetails.find(
        (product) => Array.isArray(product.colors) && product.colors.length,
      )?.colors;
      const selectedColor = (colors || []).find(
        (color) =>
          typeof color === "object" &&
          String(color.color || "").toLowerCase() ===
            String(item.color || "").toLowerCase(),
      );
      const image =
        item.productImage?.secure_url ||
        item.image ||
        (typeof item.productImage === "string" ? item.productImage : "") ||
        item.data?.image ||
        selectedColor?.mainImage?.secure_url ||
        selectedColor?.mainImage?.url ||
        colors?.[0]?.mainImage?.secure_url ||
        colors?.[0]?.mainImage?.url ||
        detail.image ||
        detail.mainImage?.secure_url ||
        detail.mainImage?.url ||
        catalogProduct?.image ||
        (catalogProduct ? getProductImage(catalogProduct) : "");
      const imageControl = image
        ? renderOrderImageToggle(image, displayName)
        : '<span class="admin-order-image-unavailable">Image unavailable</span>';
      return `<div class="admin-order-item"><div class="admin-order-item-summary"><span class="admin-order-item-name">${escapeHtml(displayName)}${quantity == null ? "" : ` × ${escapeHtml(quantity)}`}</span>${imageControl}</div><div class="admin-order-item-preview" hidden></div></div>`;
    })
    .join("");
}

function renderOrderImageToggle(image, alt, viewLabel = "View image") {
  return `<button class="admin-order-image-toggle" type="button" data-image="${escapeHtml(image)}" data-alt="${escapeHtml(alt)}" data-view-label="${escapeHtml(viewLabel)}" data-hide-label="Hide image" aria-expanded="false"><i class="fa-solid fa-image" aria-hidden="true"></i> ${escapeHtml(viewLabel)}</button>`;
}

function renderPaymentScreenshot(order) {
  const image = order.paymentScreenshot?.secure_url;
  if (!image)
    return '<span class="admin-order-image-unavailable">No screenshot</span>';
  const alt = `Payment screenshot for order ${order.orderNumber}`;
  return `<div class="admin-order-item"><div class="admin-order-item-summary"><span class="admin-order-item-name">Payment confirmation</span>${renderOrderImageToggle(image, alt, "View screenshot")}</div><div class="admin-order-item-preview" hidden></div></div>`;
}

function toggleOrderItemImage(event) {
  const button = event.target.closest(".admin-order-image-toggle");
  if (!button) return;

  const preview = button
    .closest(".admin-order-item")
    .querySelector(".admin-order-item-preview");
  if (!preview.hidden) {
    preview.hidden = true;
    preview.replaceChildren();
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = `<i class="fa-solid fa-image" aria-hidden="true"></i> ${escapeHtml(button.dataset.viewLabel || "View image")}`;
    return;
  }

  const image = document.createElement("img");
  image.className = "admin-order-item-preview-image";
  image.src = button.dataset.image;
  image.alt = button.dataset.alt || "Product image";
  image.addEventListener(
    "error",
    () => {
      preview.textContent = "Image unavailable";
    },
    { once: true },
  );
  preview.replaceChildren(image);
  preview.hidden = false;
  button.setAttribute("aria-expanded", "true");
  button.innerHTML = `<i class="fa-solid fa-eye-slash" aria-hidden="true"></i> ${escapeHtml(button.dataset.hideLabel || "Hide image")}`;
}

function renderOrderTotal(total) {
  return total == null ? "—" : formatPrice(total);
}

function saveProducts() {
  localStorage.removeItem(ADMIN_PRODUCTS_KEY);
}
function saveOrders() {
  localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(orders));
}

function statusMarkup(status) {
  const className = status.toLowerCase().replace(/\s+/g, "-");
  return `<span class="admin-status ${className}">${escapeHtml(status)}</span>`;
}

function openOrderStatusModal(order) {
  document.getElementById("orderStatusOrderId").value = order.id;
  document.getElementById("orderStatusOrderNumber").textContent =
    order.orderNumber;
  document.getElementById("orderStatusValue").value = order.status;
  document.getElementById("orderStatusModal").classList.add("open");
  document.getElementById("orderStatusValue").focus();
}

function closeOrderStatusModal() {
  document.getElementById("orderStatusModal").classList.remove("open");
}

function renderStats() {
  document.getElementById("statProducts").textContent = products.length;
  document.getElementById("statOrders").textContent = orders.length;
  document.getElementById("statPending").textContent = orders.filter(
    (order) => order.status.toLowerCase() === "pending",
  ).length;
  document.getElementById("statRevenue").textContent = formatPrice(
    orders
      .filter((order) => order.status.toLowerCase() !== "cancelled")
      .reduce((sum, order) => sum + Number(order.total || 0), 0),
  );
}

function renderRecentOrders() {
  const rows = orders
    .slice(0, 5)
    .map(
      (order) =>
        `<tr><td data-label="Order number"><strong>${escapeHtml(order.orderNumber)}</strong></td><td data-label="Full name"><strong>${escapeHtml(order.fullName)}</strong></td><td data-label="Items">${renderOrderItems(order.items)}</td><td data-label="Payment screenshot">${renderPaymentScreenshot(order)}</td><td data-label="Total"><strong>${renderOrderTotal(order.total)}</strong></td><td data-label="Status">${statusMarkup(order.status)}</td></tr>`,
    )
    .join("");
  document.getElementById("recentOrdersTable").innerHTML =
    rows || '<tr><td colspan="6" class="admin-empty">No orders yet.</td></tr>';
}

function getFilteredProducts() {
  const search = document
    .getElementById("productSearch")
    .value.toLowerCase()
    .trim();
  return products.filter(
    (product) =>
      !search ||
      `${product.name} ${product.category}`.toLowerCase().includes(search),
  );
}

function renderProducts() {
  const filtered = getFilteredProducts();
  const rows = filtered
    .map(
      (product) =>
        `<tr><td data-label="Product"><div class="admin-product-cell"><img class="admin-product-thumb" src="${escapeHtml(product.image)}" alt=""><div><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.id)}</small></div></div></td><td data-label="Category">${escapeHtml(product.category)}</td><td data-label="Price">${formatPrice(product.salePrice || product.price)}</td><td data-label="Status">${statusMarkup(product.status || "new")}</td><td data-label="Stock">${escapeHtml(product.stock ?? "-")}</td><td data-label="Actions"><div class="admin-actions"><button class="admin-icon-button edit-product" data-id="${escapeHtml(product.id)}" title="Edit product" aria-label="Edit product"><i class="fa-solid fa-pen"></i></button><button class="admin-icon-button delete-product" data-id="${escapeHtml(product.id)}" title="Delete product" aria-label="Delete product"><i class="fa-solid fa-trash"></i></button></div></td></tr>`,
    )
    .join("");
  document.getElementById("productsTable").innerHTML =
    rows ||
    '<tr><td colspan="6" class="admin-empty">No products match these filters.</td></tr>';
}

function getFilteredOrders() {
  const search = document
    .getElementById("orderSearch")
    .value.toLowerCase()
    .trim();
  const dateFilter = document.getElementById("orderDateFilter").value;
  const now = new Date("2026-08-26T23:59:59");
  return orders.filter((order) => {
    const age = (now - new Date(`${order.date}T00:00:00`)) / 86400000;
    return (
      (!search ||
        `${order.orderNumber} ${order.fullName}`
          .toLowerCase()
          .includes(search)) &&
      (!dateFilter || (dateFilter === "today" ? age < 1 : age <= 7))
    );
  });
}

function renderOrders() {
  const rows = getFilteredOrders()
    .map(
      (order) =>
        `<tr><td data-label="Order number"><strong>${escapeHtml(order.orderNumber)}</strong></td><td data-label="Full name"><strong>${escapeHtml(order.fullName)}</strong></td><td data-label="Items">${renderOrderItems(order.items)}</td><td data-label="Payment screenshot">${renderPaymentScreenshot(order)}</td><td data-label="Total"><strong>${renderOrderTotal(order.total)}</strong></td><td data-label="Status"><button class="admin-order-status-trigger" type="button" data-id="${escapeHtml(order.id)}" aria-label="Edit status for order ${escapeHtml(order.orderNumber)}">${statusMarkup(order.status)}<i class="fa-solid fa-pen" aria-hidden="true"></i></button></td><td data-label="Actions"><button class="admin-icon-button delete-order" type="button" data-id="${escapeHtml(order.id)}" title="Delete order" aria-label="Delete order ${escapeHtml(order.orderNumber)}"><i class="fa-solid fa-trash"></i></button></td></tr>`,
    )
    .join("");
  document.getElementById("ordersTable").innerHTML =
    rows ||
    '<tr><td colspan="7" class="admin-empty">No orders match these filters.</td></tr>';
}

function populateCategoryFilter() {
  const categories = PRODUCT_CATEGORIES;
  const filter = document.getElementById("productCategoryFilter");
  const selectedCategory = filter.value;
  filter.innerHTML = '<option value="">All categories</option>';
  filter.insertAdjacentHTML(
    "beforeend",
    categories
      .map(
        (category) =>
          `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
      )
      .join(""),
  );
  filter.value = selectedCategory;
}

function populateStatusFilters() {
  ["productStatusFilter"].forEach((id) => {
    const filter = document.getElementById(id);
    filter.innerHTML = '<option value="">All statuses</option>';
    filter.insertAdjacentHTML(
      "beforeend",
      PRODUCT_STATUSES.map(
        (status) => `<option value="${status}">${status}</option>`,
      ).join(""),
    );
  });
}

function openProductModal(product = null) {
  document.getElementById("productModalTitle").textContent = product
    ? "Edit product"
    : "Add product";
  document.getElementById("productId").value =
    product?.id || product?._id || "";
  document.getElementById("productName").value = product?.name || "";
  document.getElementById("productCategory").value = product?.category || "";
  document.getElementById("productPrice").value = product?.price || "";
  document.getElementById("productDiscount").value = product?.discount ?? "";
  document.getElementById("productStatus").value = product?.status || "new";
  renderColorRows(product?.colors || []);
  renderVariantRows(product?.variants || []);
  document.getElementById("productColorsSection").open = Boolean(
    product?.colors?.length,
  );
  document.getElementById("productVariantsSection").open = Boolean(
    product?.variants?.length,
  );
  document.getElementById("productMoreOptions").open = Boolean(
    product?.discount || product?.status === "sale" || product?.isFeatured,
  );
  document.getElementById("productFeatured").checked =
    product?.isFeatured === true;
  document.getElementById("productDescription").value =
    product?.description || "";
  document.getElementById("productModal").classList.add("open");
  document.getElementById("productName").focus();
}

function removeRepeaterRow(event) {
  const row = event.currentTarget.closest(".admin-repeater-row");
  row.remove();
}

function addColorRow(color = {}) {
  const row = document.createElement("div");
  row.className = "admin-repeater-row color-row";
  row.dataset.existingColor = JSON.stringify(color);
  const hasExistingMainImage = Boolean(color.mainImage?.secure_url);
  row.innerHTML = `
    <div class="admin-color-row-heading">
      <strong>Color option</strong>
      <button class="admin-repeater-remove" type="button" title="Remove color" aria-label="Remove color"><i class="fa-solid fa-trash"></i></button>
    </div>
    <label class="admin-file-field">Color name<input data-color type="text" placeholder="For example Black" aria-label="Color name" value="${escapeHtml(color.color || "")}" required></label>
    <label class="admin-file-field">Main image${hasExistingMainImage ? " (optional replacement)" : ""}<input data-main-file type="file" accept="image/*" ${hasExistingMainImage ? "" : "required"}></label>
    <label class="admin-file-field admin-repeater-wide">Sub images <span>(optional)</span><input data-sub-files type="file" accept="image/*" multiple></label>
    ${hasExistingMainImage ? `<img class="admin-color-image-preview" src="${escapeHtml(color.mainImage.secure_url)}" alt="Current ${escapeHtml(color.color)} product color">` : ""}
  `;
  row
    .querySelector(".admin-repeater-remove")
    .addEventListener("click", removeRepeaterRow);
  document.getElementById("colorRows").append(row);
}

function addVariantRow(variant = {}) {
  const row = document.createElement("div");
  row.className = "admin-repeater-row variant-row";
  row.innerHTML = `
    <input data-variant-color type="text" placeholder="Color (optional)" aria-label="Variant color" value="${escapeHtml(variant.color || "")}">
    <input data-variant-size type="text" placeholder="Size (for example M)" aria-label="Variant size" value="${escapeHtml(variant.size || "")}" required>
    <input data-variant-stock type="number" min="0" placeholder="Stock" aria-label="Variant stock" value="${variant.stock ?? ""}" required>
    <button class="admin-repeater-remove" type="button" title="Remove size" aria-label="Remove size"><i class="fa-solid fa-trash"></i></button>
  `;
  row
    .querySelector(".admin-repeater-remove")
    .addEventListener("click", removeRepeaterRow);
  document.getElementById("variantRows").append(row);
}

function renderColorRows(colors) {
  const container = document.getElementById("colorRows");
  container.innerHTML = "";
  colors.forEach(addColorRow);
}

function renderVariantRows(variants) {
  const container = document.getElementById("variantRows");
  container.innerHTML = "";
  variants.forEach(addVariantRow);
}

function collectColors() {
  const files = [];
  const colors = [...document.querySelectorAll("#colorRows .color-row")].map(
    (row, colorIndex) => {
      const mainFile = row.querySelector("[data-main-file]").files[0];
      const subFiles = [...row.querySelector("[data-sub-files]").files];
      const colorName = row.querySelector("[data-color]").value.trim();
      const existingColor = JSON.parse(row.dataset.existingColor || "{}");
      if (!mainFile && !existingColor.mainImage?.secure_url) {
        throw new Error(
          `Choose a main image for ${colorName || "this color"}.`,
        );
      }
      if (mainFile) {
        files.push({ field: `main-image-${colorIndex}`, file: mainFile });
      }
      subFiles.forEach((file) =>
        files.push({ field: `sub-images-${colorIndex}`, file }),
      );
      return {
        color: colorName,
        ...(existingColor.mainImage
          ? { mainImage: existingColor.mainImage }
          : {}),
        ...(existingColor.subImages
          ? { subImages: existingColor.subImages }
          : {}),
      };
    },
  );
  return { colors, files };
}

function collectVariants() {
  return [...document.querySelectorAll("#variantRows .variant-row")].map(
    (row) => ({
      color: row.querySelector("[data-variant-color]").value.trim(),
      size: row.querySelector("[data-variant-size]").value.trim(),
      stock: Number(row.querySelector("[data-variant-stock]").value),
    }),
  );
}

function closeProductModal() {
  document.getElementById("productModal").classList.remove("open");
}

function openDeleteConfirmation(type, item) {
  deleteTarget = { type, item };
  document.getElementById("deleteConfirmationTitle").textContent =
    `Delete ${type}?`;
  document.getElementById("deleteConfirmationName").textContent =
    type === "product" ? item.name : item.orderNumber;
  document.getElementById("deleteProductModal").classList.add("open");
  document.getElementById("cancelDeleteProductButton").focus();
}

function closeDeleteConfirmation() {
  deleteTarget = null;
  document.getElementById("deleteProductModal").classList.remove("open");
}

function setupViews() {
  const links = document.querySelectorAll("[data-view]");
  const title = document.getElementById("pageTitle");
  links.forEach((link) =>
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const view = link.dataset.view;
      document
        .querySelectorAll(".admin-nav-link")
        .forEach((item) =>
          item.classList.toggle("active", item.dataset.view === view),
        );
      document
        .querySelectorAll("[data-view-panel]")
        .forEach((panel) =>
          panel.classList.toggle("active", panel.dataset.viewPanel === view),
        );
      title.textContent = view[0].toUpperCase() + view.slice(1);
      window.location.hash = view;
    }),
  );
}

function setupEvents() {
  document
    .getElementById("productSearch")
    .addEventListener("input", renderProducts);
  ["productCategoryFilter", "productStatusFilter"].forEach((id) =>
    document.getElementById(id).addEventListener("change", () => {
      loadAdminProducts().catch(showAdminError);
    }),
  );
  ["orderSearch", "orderDateFilter"].forEach((id) =>
    document.getElementById(id).addEventListener("input", renderOrders),
  );
  ["recentOrdersTable", "ordersTable"].forEach((id) =>
    document.getElementById(id).addEventListener("click", toggleOrderItemImage),
  );
  document
    .getElementById("orderStatusFilter")
    .addEventListener("change", () => loadAdminOrders().catch(showAdminError));
  document
    .getElementById("addProductButton")
    .addEventListener("click", () => openProductModal());
  document
    .getElementById("addColorButton")
    .addEventListener("click", () => addColorRow());
  document
    .getElementById("addVariantButton")
    .addEventListener("click", () => addVariantRow());
  document
    .getElementById("closeProductModal")
    .addEventListener("click", closeProductModal);
  document
    .getElementById("cancelProductModal")
    .addEventListener("click", closeProductModal);
  document
    .getElementById("logoutButton")
    .addEventListener("click", () => clearAdminToken());
  document
    .getElementById("productsTable")
    .addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      const product = products.find(
        (item) => String(item.id) === button.dataset.id,
      );
      if (button.classList.contains("edit-product")) openProductModal(product);
      if (button.classList.contains("delete-product") && product)
        openDeleteConfirmation("product", product);
    });
  document
    .getElementById("closeDeleteProductModal")
    .addEventListener("click", closeDeleteConfirmation);
  document
    .getElementById("cancelDeleteProductButton")
    .addEventListener("click", closeDeleteConfirmation);
  document
    .getElementById("deleteProductModal")
    .addEventListener("click", (event) => {
      if (event.target.id === "deleteProductModal") closeDeleteConfirmation();
    });
  document
    .getElementById("confirmDeleteProductButton")
    .addEventListener("click", async (event) => {
      if (!deleteTarget) return;
      const button = event.currentTarget;
      const { type, item } = deleteTarget;
      button.disabled = true;
      try {
        const response = await adminFetch(
          `/admin/delete-${type}/${encodeURIComponent(item.id)}`,
          { method: "DELETE" },
        );
        const result = await response.json();
        if (!response.ok || !result.data) {
          throw new Error(result.message || `Could not delete ${type}.`);
        }
        if (type === "product") {
          products = products.filter((product) => product.id !== item.id);
          renderProducts();
        } else {
          orders = orders.filter((order) => order.id !== item.id);
          renderRecentOrders();
          renderOrders();
        }
        renderStats();
        closeDeleteConfirmation();
      } catch (error) {
        showAdminError(error);
      } finally {
        button.disabled = false;
      }
    });
  document.getElementById("ordersTable").addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".delete-order");
    if (deleteButton) {
      const order = orders.find((item) => item.id === deleteButton.dataset.id);
      if (order) openDeleteConfirmation("order", order);
      return;
    }
    const trigger = event.target.closest(".admin-order-status-trigger");
    if (!trigger) return;
    const order = orders.find((item) => item.id === trigger.dataset.id);
    if (order) openOrderStatusModal(order);
  });
  document
    .getElementById("closeOrderStatusModal")
    .addEventListener("click", closeOrderStatusModal);
  document
    .getElementById("cancelOrderStatusModal")
    .addEventListener("click", closeOrderStatusModal);
  document
    .getElementById("orderStatusModal")
    .addEventListener("click", (event) => {
      if (event.target.id === "orderStatusModal") closeOrderStatusModal();
    });
  document
    .getElementById("orderStatusForm")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const orderId = document.getElementById("orderStatusOrderId").value;
      const status = document.getElementById("orderStatusValue").value;
      const submitButton = event.target.querySelector("button[type='submit']");
      submitButton.disabled = true;
      try {
        const response = await adminFetch(
          `/admin/update-order/${encodeURIComponent(orderId)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          },
        );
        const result = await response.json();
        if (!response.ok || !result.data) {
          throw new Error(result.message || "Could not update order status.");
        }

        const order = orders.find((item) => item.id === orderId);
        if (order) order.status = result.data.status || status;
        const currentFilter =
          document.getElementById("orderStatusFilter").value;
        if (currentFilter && currentFilter !== order?.status) {
          orders = orders.filter((item) => item.id !== orderId);
        }
        closeOrderStatusModal();
        renderStats();
        renderRecentOrders();
        renderOrders();
      } catch (error) {
        showAdminError(error);
      } finally {
        submitButton.disabled = false;
      }
    });
  document
    .getElementById("productForm")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      let colors;
      let colorFiles;
      let variants;
      const productId = document.getElementById("productId").value;
      try {
        ({ colors, files: colorFiles } = collectColors());
        variants = collectVariants();
      } catch (error) {
        showAdminError(error);
        return;
      }
      const discountValue = document.getElementById("productDiscount").value;
      const product = {
        ...(productId ? { productId } : {}),
        name: document.getElementById("productName").value.trim(),
        price: Number(document.getElementById("productPrice").value),
        ...(discountValue === "" ? {} : { discount: Number(discountValue) }),
        status: document.getElementById("productStatus").value,
        category: document.getElementById("productCategory").value.trim(),
        variants,
        colors,
        description: document.getElementById("productDescription").value.trim(),
        isFeatured: document.getElementById("productFeatured").checked,
      };
      if (productId && colorFiles.length) {
        showAdminError(
          new Error(
            "The update API does not accept image files. Keep existing images for this edit, or add image upload support to the backend update route.",
          ),
        );
        return;
      }
      const submitButton = event.target.querySelector("button[type='submit']");
      const modalControls = event.target.querySelectorAll(
        "input, select, textarea, button",
      );
      submitButton.disabled = true;
      submitButton.setAttribute("aria-busy", "true");
      submitButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Saving product...';
      modalControls.forEach((control) => {
        control.disabled = true;
      });
      try {
        let requestOptions;
        if (productId) {
          requestOptions = {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product),
          };
        } else {
          const formData = new FormData();
          Object.entries(product).forEach(([key, value]) => {
            formData.append(
              key,
              Array.isArray(value) ? JSON.stringify(value) : String(value),
            );
          });
          colorFiles.forEach(({ field, file }) => formData.append(field, file));
          requestOptions = { method: "POST", body: formData };
        }
        const response = await adminFetch(
          productId ? "/admin/update-product" : "/admin/add-product",
          requestOptions,
        );
        const result = await response.json();
        const savedProduct = result.data?.product || result.data;
        if (!response.ok || !savedProduct) {
          throw new Error(result.message || "Could not save product.");
        }
        closeProductModal();
        await loadAdminProducts();
        populateCategoryFilter();
      } catch (error) {
        showAdminError(error);
      } finally {
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
        submitButton.innerHTML =
          '<i class="fa-solid fa-check"></i> Save product';
        modalControls.forEach((control) => {
          control.disabled = false;
        });
      }
    });
}

function showAdminError(error) {
  console.error(error);
  window.alert(error.message || "Something went wrong. Please try again.");
}

loadAdminData()
  .then(() => {
    populateCategoryFilter();
    populateStatusFilters();
    renderStats();
    renderRecentOrders();
    renderProducts();
    renderOrders();
    setupViews();
    setupEvents();
    const initialView = window.location.hash.slice(1);
    if (["products", "orders"].includes(initialView))
      document.querySelector(`[data-view="${initialView}"]`).click();
  })
  .catch((error) => {
    console.error("Admin data loading failed:", error);
    document.querySelector(".admin-content").innerHTML =
      `<div class="admin-empty">Could not load admin data: ${escapeHtml(error.message || "Check your connection and try again.")}</div>`;
  });
