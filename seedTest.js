import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Client from "./models/Client.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connecté pour seed"))
  .catch(err => console.error(err));

const seed = async () => {
  try {
    await User.deleteMany();
    await Client.deleteMany();

    const user = await User.create({
      nom: "Atelier Test",
      telephone: "+22760000000",
      motDePasse: "123456",
      role: "user"
    });

    const client = await Client.create({
      nom: "Fatouma",
      telephone: "+22761234567"
    });

    console.log("✅ Utilisateur et client créés !");
    console.log("Utilisateur login:", user.telephone, "mot de passe: 123456");
    console.log("Client ID:", client._id);

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
