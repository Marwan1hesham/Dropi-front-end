function getCategoryFromUrl() {
  return decodeURIComponent(
    new URLSearchParams(window.location.search).get("category") || "",
  );
}

async function renderCategoryProducts(category) {
  const categoryTitle = document.getElementById("categoryTitle");
  const categoryDescription = document.getElementById("categoryDescription");
  const categoryProducts = document.getElementById("categoryProducts");

  if (!categoryProducts || !categoryTitle || !categoryDescription) return;

  const normalizedCategory = (category || "").trim().toLowerCase();
  let matchedProducts = [];
  let pageTitle = "All Products";

  if (
    normalizedCategory === "" ||
    normalizedCategory === "all" ||
    normalizedCategory === "all products"
  ) {
    matchedProducts =
      typeof fetchProducts === "function" ? await fetchProducts() : [];
  } else {
    matchedProducts =
      typeof getProductsByCategory === "function"
        ? await getProductsByCategory(normalizedCategory)
        : [];
    pageTitle = normalizedCategory
      ? normalizedCategory.charAt(0).toUpperCase() + normalizedCategory.slice(1)
      : pageTitle;
  }

  categoryTitle.textContent = pageTitle;
  categoryDescription.textContent = matchedProducts?.length
    ? normalizedCategory === "" ||
      normalizedCategory === "all" ||
      normalizedCategory === "all products"
      ? `Browse all ${matchedProducts.length} items available in the store.`
      : `Browse all ${matchedProducts.length} items in the ${pageTitle} collection.`
    : "No products available in this category.";

  if (!matchedProducts || matchedProducts.length === 0) {
    categoryProducts.innerHTML =
      "<div class='category-empty-state d-flex align-items-center justify-content-center'><p class='text-white fs-5 mb-0'>No products available in this category.</p></div>";
    return;
  }

  categoryProducts.innerHTML = matchedProducts.map(createFeaturedCard).join("");
}

(async function initCategoryPage() {
  const category = getCategoryFromUrl();
  await renderCategoryProducts(category);
})();
