import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "./models/User.js";
import Inventory from "./models/Inventory.js";
import Subscription from "./models/Subscription.js";
import Order from "./models/Order.js";
import Payment from "./models/Payment.js";

dotenv.config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connecté");
};

const resetData = async () => {
  try {
    await User.deleteMany();
    await Inventory.deleteMany();
    await Subscription.deleteMany();
    await Order.deleteMany();
    await Payment.deleteMany();
    console.log("🧹 Base nettoyée");

    // ⚠️ MOT DE PASSE EN CLAIR
    const admin = await User.create({
      name: "Admin Couture",
      email: "admin@couture.com",
      password: "123456", // ✅ PAS HASHÉ ICI
      role: "admin",
    });

    const user = await User.create({
      name: "Client Test",
      email: "client@test.com",
      password: "123456", // ✅ PAS HASHÉ
      role: "user",
    });

    await Inventory.insertMany([
      { name: "Tissu Wax", stock: 50, price: 20 },
      { name: "Fil de coton", stock: 100, price: 5 },
    ]);

    console.log("✅ Données recréées");
    process.exit();
  } catch (err) {
    console.error("❌ Reset error:", err);
    process.exit(1);
  }
};

connectDB().then(resetData);
