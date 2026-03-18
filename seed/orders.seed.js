import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

dotenv.config();

const seedOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Order.deleteMany();

    const user = await User.findOne();
    const products = await Product.find().limit(2);

    if (!user || products.length === 0) {
      console.log("⚠️ Pas assez de users ou de produits pour créer une commande");
      process.exit();
    }

    const order = new Order({
      user: user._id,
      customerName: user.name,
      customerPhone: "123456789",
      address: "123 Rue Principale",
      products: products.map((p) => ({ productId: p._id, quantity: 1 })),
      totalAmount: products.reduce((sum, p) => sum + p.price, 0),
    });

    await order.save();
    console.log("✅ Order seed créé :", order);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedOrders();
