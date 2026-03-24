import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// ✅ Import Cloudinary (déjà configuré)
import "./utils/cloudinary.js";   // juste pour charger la config

dotenv.config();

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(cors({
  origin: "*",
  credentials: true,
}));

/* ================= MONGODB ================= */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB Atlas connecté");
  } catch (error) {
    console.error("❌ Connexion MongoDB échouée :", error.message);
    setTimeout(connectDB, 5000);
  }
};

connectDB();

/* ================= ROUTES ================= */
import adminParametresRoutes from "./routes/adminParametres.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import adminSetupRoutes from "./routes/createAdmin.js";
import employeesRoutes from "./routes/employees.js";
import clientsRoutes from "./routes/clients.js";
import mesuresRoutes from "./routes/mesures.js";
import commandesRoutes from "./routes/commandes.js";
import parametresRoutes from "./routes/parametres.js";
import articlesRoutes from "./routes/articles.js";
import ventesRoutes from "./routes/ventes.js";
import depensesRoutes from "./routes/depenses.js";
import galerieRoutes from "./routes/galerie.js";
import financesRoutes from "./routes/finances.js";
import abonnementRoutes from "./routes/abonnement.js";

// Montage des routes
app.use("/api/admin-parametres", adminParametresRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin-setup", adminSetupRoutes);
app.use("/api/employes", employeesRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/mesures", mesuresRoutes);
app.use("/api/commandes", commandesRoutes);
app.use("/api/parametres", parametresRoutes);
app.use("/api/articles", articlesRoutes);
app.use("/api/ventes", ventesRoutes);
app.use("/api/depenses", depensesRoutes);
app.use("/api/galerie", galerieRoutes);
app.use("/api/finances", financesRoutes);
app.use("/api/abonnement", abonnementRoutes);

/* ================= ROUTE RACINE & HEALTH ================= */
app.get("/", (req, res) => {
  res.json({
    message: "✅ Backend Couture API ONLINE - Cloudinary Mode",
    status: "ok"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

/* ================= 404 & ERROR HANDLER ================= */
app.use((req, res) => {
  res.status(404).json({ error: "Route non trouvée ❌" });
});

app.use((err, req, res, next) => {
  console.error("❌ Erreur serveur :", err.stack);
  res.status(500).json({ error: err.message || "Erreur interne du serveur" });
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🌐 Backend → https://backend-couture-production.up.railway.app`);
});
