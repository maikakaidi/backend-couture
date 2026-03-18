import express from "express";
import Settings from "../models/Settings.js";

const router = express.Router();

// ✅ Récupérer les paramètres de l'atelier
router.get("/", async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings || {}); // ⚡ renvoie vide si aucun paramètre
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err });
  }
});

// ✅ Mettre à jour ou créer les paramètres
router.put("/", async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      {}, // ⚡ prend le premier document
      req.body,
      { new: true, upsert: true } // ⚡ crée si inexistant
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err });
  }
});

export default router;
