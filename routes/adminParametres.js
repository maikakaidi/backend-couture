import express from "express";
import multer from "multer";
import AdminParametres from "../models/AdminParametres.js";
import { uploadToCloudinary } from "../utils/cloudinary.js"; // ← importe la fonction qu'on a créée

const router = express.Router();

// Configuration Multer temporaire (on stocke juste le fichier en mémoire ou sur disque temporaire)
const upload = multer({
  storage: multer.memoryStorage(), // ou diskStorage si tu préfères
  limits: { fileSize: 5 * 1024 * 1024 }, // limite 5MB
});

/* =====================================================
   ✅ UPLOAD IMAGE PROMO → Cloudinary
===================================================== */

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucune image reçue" });
    }

    // Upload direct vers Cloudinary
    const imageUrl = await uploadToCloudinary(req.file.buffer, "promos");

    res.json({
      message: "Image uploadée sur Cloudinary ✅",
      image: imageUrl, // ← URL complète HTTPS (ex: https://res.cloudinary.com/...)
    });
  } catch (error) {
    console.error("Erreur upload promo:", error);
    res.status(500).json({ message: "Erreur lors de l'upload" });
  }
});

/* =====================================================
   ✅ SAUVEGARDE PARAMETRES (message + images défilantes)
===================================================== */

router.post("/save", async (req, res) => {
  try {
    const { messageDefilant, imagesDefilantes } = req.body;

    let parametres = await AdminParametres.findOne();

    if (!parametres) {
      parametres = new AdminParametres();
    }

    parametres.messageDefilant = messageDefilant || "";
    parametres.imagesDefilantes = imagesDefilantes || []; // ← tableau d'URLs Cloudinary

    await parametres.save();

    res.json(parametres);
  } catch (error) {
    console.error("Erreur sauvegarde paramètres:", error);
    res.status(500).json({ message: "Erreur sauvegarde paramètres" });
  }
});

/* =====================================================
   ✅ GET PARAMETRES
===================================================== */

router.get("/", async (req, res) => {
  try {
    const parametres = await AdminParametres.findOne();
    res.json(parametres || {});
  } catch (error) {
    console.error("Erreur récupération paramètres:", error);
    res.status(500).json({ message: "Erreur récupération" });
  }
});

export default router;
