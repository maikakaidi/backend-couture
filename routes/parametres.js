import express from "express";
import bcrypt from "bcryptjs";
import Parametres from "../models/Parametres.js";
import User from "../models/User.js";
import { protect, atelierUsers } from "../middlewares/authMiddleware.js";
import { canModify } from "../middlewares/permissions.js";
import upload from "../config/multer.js";

const router = express.Router();

// ✅ Sauvegarder paramètres
router.post("/save", protect, canModify, upload.single("logo"), async (req, res) => {
  try {
    const { atelierNom, themeCouleur, whatsappMsg } = req.body;

    const data = {
      atelierNom,
      themeCouleur,
      whatsappMsg,
      atelierId: req.user.atelierId
    };

    if (req.file) {
      // Sauvegarde l’URL complète pour éviter les chemins cassés
      data.logo = `${req.protocol}://${req.get("host")}/uploads/logos/${req.file.filename}`;
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

// 🔑 Changer mot de passe
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

// 📥 Récupérer paramètres
router.get("/", protect, atelierUsers, async (req, res) => {
  try {
    const parametres = await Parametres.findOne({ atelierId: req.user.atelierId });
    res.json(parametres);
  } catch (error) {
    res.status(500).json({ message: "Erreur récupération paramètres" });
  }
});

export default router;
