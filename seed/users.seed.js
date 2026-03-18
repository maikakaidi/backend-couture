import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const users = [
  { name: "Alice", email: "alice@test.com", password: "password123" },
  { name: "Bob", email: "bob@test.com", password: "password123" },
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await User.deleteMany();
    const createdUsers = await User.insertMany(users);
    console.log("✅ Users seed créés :", createdUsers);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedUsers();
