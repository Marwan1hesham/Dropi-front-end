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

  const matchedProducts =
    typeof getProductsByCategory === "function"
      ? await getProductsByCategory(category)
      : [];

  categoryTitle.textContent = category || "Category";
  categoryDescription.textContent = matchedProducts?.length
    ? `Browse all ${matchedProducts.length} items in the ${category} collection.`
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
