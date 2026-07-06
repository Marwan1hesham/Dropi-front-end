const PRODUCTS_URL = "../data/products.json";

async function fetchProducts() {
  try {
    const response = await fetch(PRODUCTS_URL);
    if (!response.ok) {
      throw new Error(`Failed to load products: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function getFeaturedProducts(limit = 4) {
  const products = await fetchProducts();
  const featured = products.filter((product) =>
    ["Sale", "New"].includes(product.status),
  );
  return featured.length ? featured.slice(0, limit) : products.slice(0, limit);
}

async function getProductById(id) {
  if (!id) return null;
  const products = await fetchProducts();
  return products.find((product) => product.id === id) || null;
}

async function getProductsByCategory(category) {
  if (!category) return [];
  const products = await fetchProducts();
  return products.filter(
    (product) => product.category.toLowerCase() === category.toLowerCase(),
  );
}

window.fetchProducts = fetchProducts;
window.loadProducts = fetchProducts;
window.getFeaturedProducts = getFeaturedProducts;
window.getProductById = getProductById;
window.getProductsByCategory = getProductsByCategory;
