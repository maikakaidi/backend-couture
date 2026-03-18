import express from "express";
import Client from "../models/Client.js";
import { protect, adminAtelierOnly, atelierUsers } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ➕ Ajouter un client (accessible à adminatelier, user, soususer, superadmin)
router.post("/", protect, atelierUsers, async (req, res) => {
  try {
    const client = new Client({
      nom: req.body.nom,
      telephone: req.body.telephone,
      adresse: req.body.adresse,
      atelierId: req.user.atelierId
    });
    await client.save();
    res.json({ message: "Client créé ✅", client });
  } catch (err) {
    console.error("❌ Erreur ajout client:", err);
    res.status(500).json({ message: "Erreur ajout client", error: err });
  }
});

// 📋 Récupérer tous les clients de l’atelier (lecture pour tous les utilisateurs internes)
router.get("/", protect, atelierUsers, async (req, res) => {
  try {
    const clients = await Client.find({ atelierId: req.user.atelierId }).sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    console.error("❌ Erreur récupération clients:", err);
    res.status(500).json({ message: "Erreur récupération clients", error: err });
  }
});

// 🔎 Recherche clients par nom ou téléphone (lecture pour tous les utilisateurs internes)
router.get("/search", protect, atelierUsers, async (req, res) => {
  try {
    const q = req.query.q;
    const regex = new RegExp(q, "i");
    const clients = await Client.find({
      atelierId: req.user.atelierId,
      $or: [{ nom: regex }, { telephone: regex }]
    });
    res.json(clients);
  } catch (err) {
    console.error("❌ Erreur recherche clients:", err);
    res.status(500).json({ message: "Erreur recherche clients", error: err });
  }
});

// ✏️ Modifier un client (admin atelier ou superadmin uniquement)
router.put("/:id", protect, adminAtelierOnly, async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, atelierId: req.user.atelierId },
      req.body,
      { new: true }
    );
    if (!client) return res.status(404).json({ error: "Client introuvable ❌" });
    res.json({ message: "Client modifié ✅", client });
  } catch (err) {
    console.error("❌ Erreur modification client:", err);
    res.status(500).json({ message: "Erreur modification client", error: err });
  }
});

// ❌ Supprimer un client (admin atelier ou superadmin uniquement)
router.delete("/:id", protect, adminAtelierOnly, async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ _id: req.params.id, atelierId: req.user.atelierId });
    if (!client) return res.status(404).json({ error: "Client introuvable ❌" });
    res.json({ message: "Client supprimé ✅" });
  } catch (err) {
    console.error("❌ Erreur suppression client:", err);
    res.status(500).json({ message: "Erreur suppression client", error: err });
  }
});

export default router;
