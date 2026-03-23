import express from "express";
import bcrypt from "bcryptjs";
import Parametres from "../models/Parametres.js";
import User from "../models/User.js";
import { protect, atelierUsers } from "../middlewares/authMiddleware.js";
import { canModify } from "../middlewares/permissions.js";
import multer from "multer";
import { uploadToCloudinary } from "../utils/cloudinary.js"; // ← importe la fonction Cloudinary

const router = express.Router();

// Configuration Multer temporaire (on stocke en mémoire ou sur disque temporaire)
const upload = multer({
  storage: multer.memoryStorage(), // ou diskStorage si tu préfères
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// ✅ Sauvegarder paramètres (avec upload logo Cloudinary)
router.post("/save", protect, canModify, upload.single("logo"), async (req, res) => {
  try {
    const { atelierNom, themeCouleur, whatsappMsg } = req.body;

    const data = {
      atelierNom,
      themeCouleur,
      whatsappMsg,
      atelierId: req.user.atelierId
    };

    // Si un nouveau logo est uploadé → on l’envoie sur Cloudinary
    if (req.file) {
      const logoUrl = await uploadToCloudinary(req.file.buffer, 'logos');
      data.logo = logoUrl; // ← URL complète HTTPS Cloudinary
    }

    let parametres = await Parametres.findOne({ atelierId: req.user.atelierId });

    if (parametres) {
      Object.assign(parametres, data);
      await parametres.save();
    } else {
      parametres = new Parametres(data);
      await parametres.save();
    }

    res.json(parametres);
  } catch (error) {
    console.error("❌ Erreur sauvegarde paramètres:", error);
    res.status(500).json({ message: "Erreur sauvegarde paramètres" });
  }
});

// 🔑 Changer mot de passe (inchangé, pas d'image ici)
router.post("/change-password", protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select("+motDePasse");

    const isMatch = await bcrypt.compare(oldPassword, user.motDePasse);
    if (!isMatch) return res.status(400).json({ message: "Ancien mot de passe incorrect" });

    const salt = await bcrypt.genSalt(10);
    user.motDePasse = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Mot de passe changé ✅" });
  } catch (error) {
    res.status(500).json({ message: "Erreur changement mot de passe" });
  }
});

// 📥 Récupérer paramètres (inchangé)
router.get("/", protect, atelierUsers, async (req, res) => {
  try {
    const parametres = await Parametres.findOne({ atelierId: req.user.atelierId });
    res.json(parametres);
  } catch (error) {
    res.status(500).json({ message: "Erreur récupération paramètres" });
  }
});

export default router;
