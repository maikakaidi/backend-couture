import express from "express";
import Employee from "../models/Employee.js";
import { protect, atelierUsers } from "../middlewares/authMiddleware.js";
import { canModify } from "../middlewares/permissions.js";

const router = express.Router();

// 📋 GET tous les employés de l’atelier (lecture pour tous les utilisateurs internes)
router.get("/", protect, atelierUsers, async (req, res) => {
  try {
    const employees = await Employee.find({ atelierId: req.user.atelierId }).sort({ createdAt: -1 });
    const result = employees.map(e => ({
      ...e.toObject(),
      salaireNet: e.salaireNet()
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération employés ❌" });
  }
});

// ➕ POST ajouter un employé (insertion autorisée pour adminatelier, soususer, user, superadmin)
router.post("/", protect, atelierUsers, async (req, res) => {
  try {
    const { nom, poste, salaire } = req.body;
    if (!nom || !poste || !salaire) {
      return res.status(400).json({ error: "Nom, poste et salaire requis ❌" });
    }

    const emp = new Employee({
      nom,
      poste,
      salaire,
      advances: [],
      atelierId: req.user.atelierId
    });

    await emp.save();
    res.status(201).json({ message: "Employé ajouté ✅", emp });
  } catch (err) {
    res.status(500).json({ error: "Erreur ajout employé ❌" });
  }
});

// ✏️ PUT modifier un employé (admin atelier ou superadmin uniquement)
router.put("/:id", protect, canModify, async (req, res) => {
  try {
    const emp = await Employee.findOneAndUpdate(
      { _id: req.params.id, atelierId: req.user.atelierId },
      req.body,
      { new: true }
    );
    if (!emp) return res.status(404).json({ error: "Employé introuvable ❌" });
    res.json({ message: "Employé modifié ✅", emp });
  } catch (err) {
    res.status(500).json({ error: "Erreur modification employé ❌" });
  }
});

// ❌ DELETE supprimer un employé (admin atelier ou superadmin uniquement)
router.delete("/:id", protect, canModify, async (req, res) => {
  try {
    const emp = await Employee.findOneAndDelete({ _id: req.params.id, atelierId: req.user.atelierId });
    if (!emp) return res.status(404).json({ error: "Employé introuvable ❌" });
    res.json({ message: "Employé supprimé ✅" });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression employé ❌" });
  }
});

// ➕ PUT ajouter une avance (admin atelier ou superadmin uniquement)
router.put("/:id/avance", protect, canModify, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Montant d'avance invalide ❌" });
    }

    const emp = await Employee.findOneAndUpdate(
      { _id: req.params.id, atelierId: req.user.atelierId },
      { $push: { advances: { amount, date: new Date() } } },
      { new: true }
    );

    if (!emp) return res.status(404).json({ error: "Employé introuvable ❌" });
    res.json({ message: "Avance ajoutée ✅", emp });
  } catch (err) {
    res.status(500).json({ error: "Erreur ajout avance ❌" });
  }
});

export default router;
