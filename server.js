import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ✅ Import Cloudinary config centralisée
import cloudinary, { uploadToCloudinary } from "./utils/cloudinary.js";

dotenv.config();
mongoose.set("strictQuery", false);

const app = express();

/* ================= MIDDLEWARE ================= */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ CORS (mobile + ordinateur)
app.use(cors({
  origin: "*",
  credentials: true,
}));

/* ================= ES MODULE FIX ================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= UPLOADS ================= */

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// sous dossiers auto
["logos", "promos", "commandes", "galerie"].forEach(folder => {
  const dir = path.join(uploadsDir, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// servir images statiques
app.use("/uploads", express.static(uploadsDir));

console.log("📂 Uploads servis depuis :", uploadsDir);

/* ================= MONGODB ATLAS ================= */

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB Atlas connecté");

  } catch (error) {
    console.error("❌ Connexion MongoDB échouée :", error.message);

    // retry auto
    setTimeout(connectDB, 5000);
  }
};

connectDB();

/* ===== Events Mongo ===== */

mongoose.connection.on("connected", () => {
  console.log("📡 MongoDB reconnecté");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Erreur MongoDB :", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB déconnecté...");
});

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

// montage routes API
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

/* ================= ROUTE UPLOAD CLOUDINARY ================= */

app.post("/api/upload", async (req, res) => {
  try {
    const { filePath } = req.body; // chemin local ou base64
    const url = await uploadToCloudinary(filePath);
    res.json({ url });
  } catch (error) {
    console.error("❌ Erreur upload Cloudinary :", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ================= ROUTE RACINE ================= */

app.get("/", (req, res) => {
  res.json({
    message: "✅ Backend Couture API ONLINE",
    docs: "/docs",
    health: "/api/health",
  });
});

/* ================= DOCS ================= */

app.use("/docs", express.static("docs"));

/* ================= HEALTH CHECK ================= */

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    mongo:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

/* ================= 404 ================= */

app.use((req, res) => {
  res.status(404).json({ error: "Route non trouvée ❌" });
});

/* ================= ERROR HANDLER ================= */

app.use((err, req, res, next) => {
  console.error("❌ Erreur serveur :", err.stack);
  res.status(500).json({
    error: err.message || "Erreur interne du serveur",
  });
});

/* ================= NODE GLOBAL ERRORS ================= */

process.on("uncaughtException", (err) => {
  console.error("❌ Erreur non capturée :", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Promesse rejetée non gérée :", reason);
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`💻 Local → http://localhost:${PORT}`);
  console.log(`🖼 Images → http://localhost:${PORT}/uploads`);
});
