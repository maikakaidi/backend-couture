import express from "express";
import Atelier from "../models/Atelier.js";
import Abonnement from "../models/Abonnement.js";
import User from "../models/User.js";
import { protect, superAdminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 🔄 Créer un nouvel atelier (réservé au superadmin)
router.post("/create", protect, superAdminOnly, async (req, res) => {
  try {
    const { nom, description, telephone, adresse, plan, paiement, adminId } = req.body;

    if (!["essai", "3mois", "6mois", "1an"].includes(plan)) {
      return res.status(400).json({ error: "Plan invalide ❌" });
    }

    // Dates abonnement
    const dateDebut = new Date();
    let dateFin;
    if (plan === "essai") {
      dateFin = new Date(dateDebut);
      dateFin.setDate(dateDebut.getDate() + 7);
    } else if (plan === "3mois") {
      dateFin = new Date(dateDebut);
      dateFin.setMonth(dateDebut.getMonth() + 3);
    } else if (plan === "6mois") {
      dateFin = new Date(dateDebut);
      dateFin.setMonth(dateDebut.getMonth() + 6);
    } else if (plan === "1an") {
      dateFin = new Date(dateDebut);
      dateFin.setFullYear(dateDebut.getFullYear() + 1);
    }

    // ✅ Créer l’atelier (sans email à l’inscription)
    const atelier = new Atelier({
      nom,
      description,
      adminId,
      telephone,
      adresse
    });
    await atelier.save();

    // ✅ Créer l’abonnement lié à l’atelier
    const abonnement = new Abonnement({
      atelierId: atelier._id,
      type: plan,
      actif: true,
      dateDebut,
      dateFin,
      moyenPaiement: paiement,
      utilisateursInclus: 1,
      utilisateursPayants: 0
    });
    await abonnement.save();

    // ✅ Mettre à jour l’atelier avec l’abonnement
    atelier.abonnement = abonnement._id;

    // ⚡ Email uniquement si fourni lors du paiement
    if (paiement && req.body.email) {
      atelier.email = req.body.email;
    }

    await atelier.save();

    // ✅ Mettre à jour l’admin avec atelier + abonnement
    if (adminId) {
      await User.findByIdAndUpdate(adminId, {
        atelierId: atelier._id,
        abonnement: abonnement._id,
        role: "adminatelier"
      });
    }

    const diffMs = dateFin - new Date();
    const joursRestants = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    res.json({
      message: plan === "essai" ? "Atelier créé avec abonnement essai ✅" : `Atelier créé avec abonnement ${plan} ✅`,
      atelier,
      abonnement,
      joursRestants
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur création atelier ❌", details: err.message });
  }
});

// 📋 Récupérer les infos d’un atelier (admin atelier ou superadmin uniquement)
router.get("/:id", protect, async (req, res) => {
  try {
    const atelier = await Atelier.findById(req.params.id)
      .populate("utilisateurs", "nom telephone role")
      .populate("abonnement");

    if (!atelier) return res.status(404).json({ error: "Atelier introuvable ❌" });

    // ✅ Vérifier que l’utilisateur a le droit de voir cet atelier
    if (req.user.role !== "superadmin" && String(atelier._id) !== String(req.user.atelierId)) {
      return res.status(403).json({ error: "Accès refusé ❌" });
    }

    res.json(atelier);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération atelier ❌" });
  }
});

export default router;
