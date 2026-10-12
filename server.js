require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    discount: { type: Number, default: 0 },
    status: { type: String, required: true },
    category: { type: String, required: true },
    colors: [
      {
        color: { type: String, required: true },
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
      },
    ],
    variants: [
      {
        color: { type: String, required: true },
        size: { type: String, required: true },
        stock: { type: Number, required: true, min: 0 },
      },
    ],
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Product = mongoose.model("Product", productSchema);

const orderSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: Number, required: true },
    email: { type: String, required: true, trim: true },
    governorate: { type: String, required: true },
    address: { type: String, required: true },
    comments: { type: String, default: "" },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        color: { type: String, required: true },
        size: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    status: { type: String, default: "pending" },
    orderNumber: { type: Number, unique: true, required: true },
    paymentMethod: { type: String, required: true },
    paymentScreenshot: {
      secure_url: String,
      public_id: String,
    },
  },
  { timestamps: true },
);

const Order = mongoose.model("Order", orderSchema);

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

app.post("/api/orders", async (req, res) => {
  try {
    const { products, paymentMethod } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one product is required" });
    }
    if (!paymentMethod) {
      return res.status(400).json({ message: "Payment method is required" });
    }

    const productIds = products.map((item) => item.productId);
    const existingProducts = await Product.find({ _id: { $in: productIds } })
      .select("_id variants")
      .lean();
    const productMap = new Map(
      existingProducts.map((product) => [String(product._id), product]),
    );

    for (const item of products) {
      const product = productMap.get(String(item.productId));
      const variant = product?.variants?.find(
        (candidate) =>
          candidate.color === item.color && candidate.size === item.size,
      );
      if (!variant || variant.stock < Number(item.quantity)) {
        return res.status(400).json({
          message: "One or more selected product variants are unavailable",
        });
      }
    }

    const latestOrder = await Order.findOne()
      .sort({ orderNumber: -1 })
      .select("orderNumber")
      .lean();
    const orderNumber = (latestOrder?.orderNumber || 1000) + 1;
    const order = await Order.create({ ...req.body, orderNumber });
    res.status(201).json({ data: order });
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ message: "Failed to create order" });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("products.productId")
      .sort({ createdAt: -1 })
      .lean();
    res.json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
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
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required to start the server");
  }
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");
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
