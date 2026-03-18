import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Admin from "./models/Admin.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connecté");

    const hashedPassword = await bcrypt.hash("123456", 10);

    const admin = new Admin({
      email: "admin@gmail.com",
      password: hashedPassword
    });

    await admin.save();
    console.log("ADMIN CRÉÉ AVEC SUCCÈS");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createAdmin();
