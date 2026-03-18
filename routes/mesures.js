import express from "express";
import Mesure from "../models/Mesure.js";
import Client from "../models/Client.js";
import { protect, atelierUsers } from "../middlewares/authMiddleware.js";
import { canModify } from "../middlewares/permissions.js";

const router = express.Router();

// 📋 Récupérer mesures d’un client
router.get("/:clientId", protect, atelierUsers, async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.clientId, atelierId: req.user.atelierId });
    if (!client) return res.status(404).json({ error: "Client introuvable ❌" });

    const mesures = await Mesure.find({ clientId: client._id, atelierId: req.user.atelierId });
    res.json({ client, mesures });
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération mesures ❌" });
  }
});

// ➕ Ajouter une mesure
router.post("/:clientId", protect, atelierUsers, async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.clientId, atelierId: req.user.atelierId });
    if (!client) return res.status(404).json({ error: "Client introuvable ❌" });

    const mesure = new Mesure({
      type: req.body.type,
      valeur: req.body.valeur,
      clientId: client._id,
      atelierId: req.user.atelierId
    });

    await mesure.save();
    const populated = await mesure.populate("clientId", "nom telephone"); // ✅ renvoie client peuplé

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: "Erreur ajout mesure ❌" });
  }
});

// ✏️ Modifier une mesure
router.put("/:id", protect, canModify, async (req, res) => {
  try {
    const mesure = await Mesure.findOneAndUpdate(
      { _id: req.params.id, atelierId: req.user.atelierId },
      req.body,
      { new: true }
    ).populate("clientId", "nom telephone"); // ✅ renvoie client peuplé

    if (!mesure) return res.status(404).json({ error: "Mesure introuvable ❌" });
    res.json(mesure);
  } catch (err) {
    res.status(500).json({ error: "Erreur modification mesure ❌" });
  }
});

// ❌ Supprimer une mesure
router.delete("/:id", protect, canModify, async (req, res) => {
  try {
    const mesure = await Mesure.findOneAndDelete({ _id: req.params.id, atelierId: req.user.atelierId });
    if (!mesure) return res.status(404).json({ error: "Mesure introuvable ❌" });
    res.json({ message: "Mesure supprimée ✅" });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression mesure ❌" });
  }
});

export default router;
