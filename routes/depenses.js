import express from "express";
import Depense from "../models/Depense.js";
import { protect, atelierUsers } from "../middlewares/authMiddleware.js";
import { isAdminOrCanModify } from "../middlewares/permissions.js";

const router = express.Router();

// 📋 Récupérer toutes les dépenses
router.get("/", protect, atelierUsers, async (req, res) => {
  try {
    const depenses = await Depense.find({ atelierId: req.user.atelierId }).sort({ dateDepense: -1 });
    res.json(depenses);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération dépenses ❌" });
  }
});

// ➕ Créer une dépense
router.post("/", protect, atelierUsers, async (req, res) => {
  try {
    const { titre, montant, categorie, dateDepense } = req.body;
    if (!titre || montant == null) {
      return res.status(400).json({ error: "Titre et montant sont requis ❌" });
    }

    const depense = new Depense({
      titre,
      montant,
      categorie: categorie || "",
      dateDepense: dateDepense ? new Date(dateDepense) : undefined,
      atelierId: req.user.atelierId,
      createdBy: req.user._id
    });

    await depense.save();
    res.status(201).json(depense); // ✅ renvoie l'objet complet
  } catch (err) {
    res.status(500).json({ error: "Erreur création dépense ❌" });
  }
});

// ✏️ Modifier une dépense
router.put("/:id", protect, isAdminOrCanModify, async (req, res) => {
  try {
    const updated = await Depense.findOneAndUpdate(
      { _id: req.params.id, atelierId: req.user.atelierId },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Dépense introuvable ❌" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erreur modification dépense ❌" });
  }
});

// ❌ Supprimer une dépense
router.delete("/:id", protect, isAdminOrCanModify, async (req, res) => {
  try {
    const depense = await Depense.findOneAndDelete({ _id: req.params.id, atelierId: req.user.atelierId });
    if (!depense) return res.status(404).json({ error: "Dépense introuvable ❌" });
    res.json({ message: "Dépense supprimée ✅" });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression dépense ❌" });
  }
});

export default router;
