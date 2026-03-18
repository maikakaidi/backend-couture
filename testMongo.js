// testMongo.js
import mongoose from "mongoose";
import dotenv from "dotenv";

// Charger les variables d'environnement depuis .env
dotenv.config();

const uri = process.env.MONGO_URI;

console.log("🔎 Tentative de connexion à:", uri);

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000 // délai 10s pour éviter ETIMEOUT trop rapide
})
  .then(() => {
    console.log("✅ Connexion réussie à MongoDB Atlas");
    return mongoose.connection.db.admin().listDatabases();
  })
  .then(dbs => {
    console.log("📂 Bases disponibles:", dbs.databases.map(db => db.name));
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Erreur de connexion:", err.message);
    process.exit(1);
  });
