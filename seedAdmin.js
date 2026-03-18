import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminExists = await User.findOne({ email: "admin@admin.com" });

    if (!adminExists) {
      const admin = new User({
        name: "Admin",
        email: "admin@admin.com",
        password: await bcrypt.hash("123456", 10),
        isAdmin: true
      });

      await admin.save();
      console.log("✅ Admin créé");
    } else {
      console.log("ℹ️ Admin déjà existant");
    }

    process.exit();
  } catch (error) {
    console.error("❌ Erreur seed admin :", error);
    process.exit(1);
  }
};

run();
