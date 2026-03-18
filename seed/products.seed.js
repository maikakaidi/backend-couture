import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";

dotenv.config();

const products = [
  { name: "Tissu Coton", price: 10, description: "Tissu coton qualité supérieure", stock: 50 },
  { name: "Machine à coudre", price: 200, description: "Machine à coudre domestique", stock: 10 },
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany();
    const createdProducts = await Product.insertMany(products);
    console.log("✅ Products seed créés :", createdProducts);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedProducts();
