import express from "express";
import Article from "../models/Article.js";
import { protect, atelierUsers } from "../middlewares/authMiddleware.js";
import { canModify } from "../middlewares/permissions.js";

const router = express.Router();

// 📋 GET tous les articles (lecture pour tous les utilisateurs internes)
router.get("/", protect, atelierUsers, async (req, res) => {
  try {
    const articles = await Article.find({ atelierId: req.user.atelierId }).sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération articles ❌" });
  }
});

// ➕ POST ajouter un article (insertion autorisée pour adminatelier, soususer, user, superadmin)
router.post("/", protect, atelierUsers, async (req, res) => {
  try {
    const { nom, prix, categorie, stock } = req.body;
    if (!nom || !prix || !categorie) {
      return res.status(400).json({ error: "Nom, prix et catégorie requis ❌" });
    }

    const article = new Article({
      nom,
      prix,
      categorie,
      stock,
      vendu: 0,
      atelierId: req.user.atelierId
    });

    await article.save();
    res.status(201).json(article);
  } catch (err) {
    res.status(500).json({ error: "Erreur ajout article ❌" });
  }
});

// ✏️ PUT modifier un article (adminatelier ou superadmin uniquement)
router.put("/:id", protect, canModify, async (req, res) => {
  try {
    const updated = await Article.findOneAndUpdate(
      { _id: req.params.id, atelierId: req.user.atelierId },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Article introuvable ❌" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erreur modification article ❌" });
  }
});

// ❌ DELETE supprimer un article (adminatelier ou superadmin uniquement)
router.delete("/:id", protect, canModify, async (req, res) => {
  try {
    const deleted = await Article.findOneAndDelete({ _id: req.params.id, atelierId: req.user.atelierId });
    if (!deleted) return res.status(404).json({ error: "Article introuvable ❌" });
    res.json({ message: "Article supprimé ✅" });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression article ❌" });
  }
});

// 🔄 Mise à jour stock (accessible à tous sauf disabled)
router.put("/:id/stock", protect, atelierUsers, async (req, res) => {
  try {
    const { action } = req.body;
    const article = await Article.findOne({ _id: req.params.id, atelierId: req.user.atelierId });

    if (!article) return res.status(404).json({ error: "Article introuvable ❌" });

    if (action === "decrement" && article.stock > 0) {
      article.stock -= 1;
      article.vendu += 1;
    } else if (action === "increment") {
      article.stock += 1;
    }

    await article.save();
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: "Erreur mise à jour stock ❌" });
  }
});

export default router;
