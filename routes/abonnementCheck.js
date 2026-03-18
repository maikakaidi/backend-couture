import express from "express";
import Abonnement from "../models/Abonnement.js";
import User from "../models/User.js";

const router = express.Router();

// Vérifier si l'abonnement est expiré
router.get("/check/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("abonnement");
    if (!user || !user.abonnement) {
      return res.status(404).json({ error: "Utilisateur ou abonnement introuvable ❌" });
    }

    const now = new Date();
    let expired = false;
    let joursRestants = null;

    if (user.abonnement.dateFin) {
      if (user.abonnement.dateFin <= now) {
        expired = true;
      } else {
        const diffMs = user.abonnement.dateFin - now;
        joursRestants = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }
    }

    res.json({
      abonnement: user.abonnement,
      expired,
      joursRestants
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur vérification abonnement ❌" });
  }
});

export default router;
