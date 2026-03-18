import express from "express";
import { protect, adminAtelierOnly, atelierUsers } from "../middlewares/authMiddleware.js";
import Abonnement from "../models/Abonnement.js";
import User from "../models/User.js";

const router = express.Router();

// 🔄 Upgrade ou activation d'abonnement
router.post("/upgrade", protect, adminAtelierOnly, async (req, res) => {
  try {
    const { plan, essai, paiement } = req.body;

    if (!["essai", "3mois", "6mois", "1an"].includes(plan)) {
      return res.status(400).json({ error: "Plan invalide ❌" });
    }

    const dateDebut = new Date();
    let dateFin;

    if (plan === "essai" || essai === true) {
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

    if (plan !== "essai" && !paiement) {
      return res.status(402).json({
        error: "Paiement requis ❌",
        message: "Veuillez régler via Orange Money (92666942), Nita (99293329) ou Amana (92666942)."
      });
    }

    const abonnement = await Abonnement.findOneAndUpdate(
      { atelierId: req.user.atelierId },
      { type: plan, actif: true, dateDebut, dateFin, moyenPaiement: paiement },
      { new: true, upsert: true }
    );

    await User.findByIdAndUpdate(req.user._id, { abonnement: abonnement._id });

    const diffMs = dateFin - new Date();
    const joursRestants = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    res.json({
      message: plan === "essai" ? "Abonnement essai activé ✅" : `Abonnement ${plan} activé ✅`,
      abonnement,
      joursRestants
    });
  } catch (err) {
    console.error("❌ Erreur upgrade:", err);
    res.status(500).json({ error: "Erreur serveur ❌" });
  }
});

// ➕ Ajouter un sous-user interne (20k FCFA, statut en attente)
router.post("/ajouter-user", protect, adminAtelierOnly, async (req, res) => {
  try {
    const { nom, telephone, motDePasse } = req.body;

    const abonnement = await Abonnement.findOne({ atelierId: req.user.atelierId });
    if (!abonnement) return res.status(404).json({ error: "Abonnement introuvable ❌" });

    const newUser = new User({
      nom,
      telephone,
      motDePasse,
      role: "soususer",
      atelierId: req.user.atelierId,
      abonnement: abonnement._id,
      statut: "en_attente" // 🔥 en attente de validation
    });

    await newUser.save();

    res.json({ message: "Sous-user créé ✅ (20k facturé, en attente de validation)", user: newUser });
  } catch (err) {
    console.error("❌ Erreur ajout utilisateur:", err);
    res.status(500).json({ error: "Erreur ajout utilisateur ❌" });
  }
});

// 📋 Récupérer tous les sous-users en attente
router.get("/soususers-attente", protect, adminAtelierOnly, async (req, res) => {
  try {
    const users = await User.find({ atelierId: req.user.atelierId, role: "soususer", statut: "en_attente" });
    res.json(users);
  } catch (err) {
    console.error("❌ Erreur récupération sous-users en attente:", err);
    res.status(500).json({ error: "Erreur récupération sous-users ❌" });
  }
});

// ✏️ Valider un sous-user
router.put("/valider-user/:id", protect, adminAtelierOnly, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, atelierId: req.user.atelierId, role: "soususer" },
      { statut: "valide" },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: "Sous-user introuvable ❌" });

    res.json({ message: "Sous-user validé ✅", user });
  } catch (err) {
    console.error("❌ Erreur validation sous-user:", err);
    res.status(500).json({ error: "Erreur validation sous-user ❌" });
  }
});

// ❌ Refuser un sous-user (le placer en essai)
router.put("/refuser-user/:id", protect, adminAtelierOnly, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, atelierId: req.user.atelierId, role: "soususer" },
      { statut: "essai" },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: "Sous-user introuvable ❌" });

    res.json({ message: "Sous-user placé en essai ⚠️", user });
  } catch (err) {
    console.error("❌ Erreur refus sous-user:", err);
    res.status(500).json({ error: "Erreur refus sous-user ❌" });
  }
});

// 📅 Infos abonnement (jours restants + compteur utilisateurs)
router.get("/infos", protect, atelierUsers, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("abonnement");

    if (!user || !user.abonnement || !user.abonnement.dateFin) {
      return res.json({ joursRestants: 0, compteurUsers: 0 });
    }

    // 🔄 Calcul jours restants
    const dateFin = new Date(user.abonnement.dateFin);
    const aujourdHui = new Date();
    const diff = dateFin - aujourdHui;
    const joursRestants = diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;

    // 🔄 Calcul compteur utilisateurs (admin + sous-users activés)
    const sousUsersCount = await User.countDocuments({
      atelierId: user.atelierId,
      role: "soususer",
      statut: "valide"
    });
    const compteurUsers = sousUsersCount + 1; // admin + sous-users

    res.json({
      atelierId: user.atelierId,
      abonnement: user.abonnement.type,
      actif: user.abonnement.actif,
      joursRestants,
      compteurUsers,
      dateFin
    });
  } catch (error) {
    console.error("❌ Erreur infos abonnement:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
