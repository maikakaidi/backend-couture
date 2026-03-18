import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Inventory from "./models/Inventory.js";
import Subscription from "./models/Subscription.js";
import Order from "./models/Order.js";
import Payment from "./models/Payment.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connecté");
  } catch (err) {
    console.error("❌ Erreur MongoDB:", err);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    // Nettoyage
    await User.deleteMany();
    await Inventory.deleteMany();
    await Subscription.deleteMany();
    await Order.deleteMany();
    await Payment.deleteMany();

    // Création d’un admin
    const admin = await User.create({
      name: "Admin Couture",
      email: "admin@couture.com",
      password: "123456", // sera hashé automatiquement
      role: "admin"
    });

    // Création d’un utilisateur normal
    const user = await User.create({
      name: "Client Test",
      email: "client@test.com",
      password: "123456",
      role: "user"
    });

    // Inventaire de test
    const items = await Inventory.insertMany([
      { name: "Tissu Wax", stock: 50, price: 20 },
      { name: "Fil de coton", stock: 100, price: 5 }
    ]);

    // Abonnement de test
    await Subscription.create({
      user: user._id,
      plan: "premium",
      active: true
    });

    // Commande de test
    const order = await Order.create({
      user: user._id,
      items: [
        { name: "Tissu Wax", qty: 2, price: 20 },
        { name: "Fil de coton", qty: 5, price: 5 }
      ],
      total: 65
    });

    // Paiement de test
    await Payment.create({
      user: user._id,
      orderId: order._id,
      status: "pending"
    });

    console.log("✅ Données de test insérées");
    process.exit();
  } catch (err) {
    console.error("❌ Erreur lors de l’insertion:", err);
    process.exit(1);
  }
};

connectDB().then(importData);
