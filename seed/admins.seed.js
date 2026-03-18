import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../models/Admin.js"; // crée le modèle Admin si pas déjà

dotenv.config();

const admins = [
  {
    name: "Super Admin",
    email: "admin@couture.com",
    password: "admin123", // sera hashé si tu as une fonction de hash
  },
];

const seedAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Admin.deleteMany();
    const createdAdmins = await Admin.insertMany(admins);
    console.log("✅ Admins seed créés :", createdAdmins);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmins();
