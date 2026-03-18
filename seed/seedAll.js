// seedAll.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// Import des modèles
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Client from "../models/Client.js";
import Inventory from "../models/Inventory.js";

dotenv.config({ path: "../.env" });

const seedAll = async () => {
  try {
    console.log("🔍 URI:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🟢 MongoDB connecté");

    // Nettoyage des collections
    await User.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    await Client.deleteMany();
    await Inventory.deleteMany();

    // Création de l'admin
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = await User.create({
      name: "Admin",
      email: "admin@couture.com",
      password: adminPassword,
      isAdmin: true,
    });

    // Création d'un utilisateur
    const userPassword = await bcrypt.hash("user123", 10);
    const user = await User.create({
      name: "User Test",
      email: "user@test.com",
      password: userPassword,
      isAdmin: false,
    });

    // Produits
    const products = await Product.insertMany([
      {
        name: "Tissu Wax",
        price: 50,
        description: "Tissu africain coloré",
        stock: 100,
        image: "wax.jpg"
      },
      {
        name: "Fil coton",
        price: 10,
        description: "Fil résistant pour couture",
        stock: 200,
        image: "fil.jpg"
      },
      {
        name: "Boutons métal",
        price: 5,
        description: "Boutons pour chemises",
        stock: 500,
        image: "boutons.jpg"
      }
    ]);

    // Commande
    await Order.create({
      products: [
        { productId: products[0]._id, quantity: 2 },
        { productId: products[1]._id, quantity: 3 }
      ],
      totalAmount: 130,
      customerName: "Client Test",
      customerPhone: "99999999",
      address: "Niamey",
      user: user._id
    });

    // Clients
    await Client.insertMany([
      {
        user: user._id,
        name: "Amina",
        phone: "90909090",
        gender: "femme",
        notes: "Cliente régulière, aime les modèles wax"
      },
      {
        user: user._id,
        name: "Issa",
        phone: "80808080",
        gender: "homme",
        notes: "Commande souvent des boubous"
      }
    ]);

    // Inventaire
    await Inventory.insertMany([
      {
        user: admin._id,
        name: "Tissu bazin",
        category: "tissu",
        quantity: 50,
        unit: "mètre"
      },
      {
        user: admin._id,
        name: "Fil noir",
        category: "fil",
        quantity: 200,
        unit: "bobine"
      },
      {
        user: admin._id,
        name: "Fermeture éclair",
        category: "accessoire",
        quantity: 100,
        unit: "pièce"
      }
    ]);

    console.log("✅ Seed terminé : admin, user, produits, commande, clients, inventaire créés");
    process.exit();
  } catch (err) {
    console.error("❌ Erreur seed :", err);
    process.exit(1);
  }
};

seedAll();
