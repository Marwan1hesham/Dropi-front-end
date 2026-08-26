const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/dropi";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    mainImage: {
      secure_url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    subImages: [
      {
        secure_url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    discount: { type: Number, default: 0 },
    status: { type: String, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true },
    colours: { type: [String], default: [] },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Product = mongoose.model("Product", productSchema);

app.use(cors());
app.use(express.json());

app.get("/api/products", async (req, res) => {
  try {
    const filter = req.query.category
      ? { category: new RegExp(`^${escapeRegExp(req.query.category)}$`, "i") }
      : {};
    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
    res.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("Failed to fetch product:", error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

app.use(express.static(path.join(__dirname)));

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function startServer() {
  await mongoose.connect(mongoUri);
  console.log(`Connected to MongoDB at ${mongoUri}`);
  app.listen(port, () => {
    console.log(
      `Dropi is running at http://localhost:${port}/pages/index.html`,
    );
  });
}

startServer().catch((error) => {
  console.error("Failed to start Dropi:", error);
  process.exit(1);
});
