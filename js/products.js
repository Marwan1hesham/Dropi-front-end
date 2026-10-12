const PRODUCTS_URL = "/api/products";
const CATEGORY_PRODUCTS_URL = "/api/products?category=";

function normalizeProduct(product) {
  const discount = Number(product.discount) || 0;
  const salePrice =
    discount > 0
      ? Math.max(0, product.price - (product.price * discount) / 100)
      : null;

  return {
    ...product,
    id: product.id || product._id,
    image: product.image || product.colors?.[0]?.mainImage?.secure_url || "",
    images: product.colors?.[0]?.subImages || [],
    colorOptions: Array.isArray(product.colors) ? product.colors : [],
    colors: (product.colors || []).map((item) =>
      typeof item === "string" ? item : item.color,
    ),
    variants: product.variants || [],
    sizes: [...new Set((product.variants || []).map((item) => item.size))],
    stock: (product.variants || []).reduce(
      (total, item) => total + Number(item.stock || 0),
      0,
    ),
    isFeatured: product.isFeatured === true,
    status: product.status
      ? product.status.charAt(0).toUpperCase() + product.status.slice(1)
      : "",
    salePrice,
  };
}

async function fetchProducts() {
  try {
    const response = await fetch(PRODUCTS_URL);
    if (!response.ok) {
      throw new Error(`Failed to load products: ${response.status}`);
    }
    const result = await response.json();
    const products = Array.isArray(result) ? result : result.data || [];
    return products.map(normalizeProduct);
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function getFeaturedProducts(limit = 4) {
  const products = await fetchProducts();
  return products
    .filter((product) => product.isFeatured === true)
    .slice(0, limit);
}

async function getNewArrivals(limit = 4) {
  const products = await fetchProducts();
  // Sort by createdAt descending. Missing/invalid dates go to the end.
  const sorted = products.slice().sort((a, b) => {
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  });
  return sorted.slice(0, limit);
}

async function getTopDiscountProducts(limit = 4) {
  const products = await fetchProducts();
  return products
    .filter((product) => Number(product.discount) > 0)
    .sort((a, b) => Number(b.discount) - Number(a.discount))
    .slice(0, limit);
}

async function getProductById(id) {
  if (!id) return null;
  const products = await fetchProducts();
  return products.find((product) => product.id === id) || null;
}

async function getProductsByCategory(category) {
  if (!category) return [];
  try {
    const response = await fetch(
      `${CATEGORY_PRODUCTS_URL}${encodeURIComponent(category.trim().toLowerCase())}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to load products: ${response.status}`);
    }
    const result = await response.json();
    const products = Array.isArray(result) ? result : result.data || [];
    return products.map(normalizeProduct);
  } catch (error) {
    console.error(error);
    return [];
  }
}

window.fetchProducts = fetchProducts;
window.loadProducts = fetchProducts;
window.getFeaturedProducts = getFeaturedProducts;
window.getProductById = getProductById;
window.getProductsByCategory = getProductsByCategory;
window.getNewArrivals = getNewArrivals;
window.getTopDiscountProducts = getTopDiscountProducts;
