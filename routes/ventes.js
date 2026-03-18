import express from "express";
import Article from "../models/Article.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 📋 Toutes les ventes de l’atelier
router.get("/", protect, async (req, res) => {
  try {
    const articles = await Article.find({ atelierId: req.user.atelierId });
    const ventes = articles.map(a => ({
      _id: a._id,
      nom: a.nom,
      categorie: a.categorie,
      prixUnitaire: a.prix,        // 🔥 cohérence avec frontend
      vendu: a.vendu,
      prixTotal: a.vendu * a.prix, // 🔥 total
      dateAjout: a.createdAt       // 🔥 utilise createdAt
    }));
    res.json(ventes);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération ventes ❌" });
  }
});

// 🔎 Recherche
router.get("/search/:query", protect, async (req, res) => {
  try {
    const q = req.params.query.toLowerCase();
    const articles = await Article.find({
      atelierId: req.user.atelierId,
      $or: [
        { nom: { $regex: q, $options: "i" } },
        { categorie: { $regex: q, $options: "i" } }
      ]
    });
    const ventes = articles.map(a => ({
      _id: a._id,
      nom: a.nom,
      categorie: a.categorie,
      prixUnitaire: a.prix,
      vendu: a.vendu,
      prixTotal: a.vendu * a.prix,
      dateAjout: a.createdAt
    }));
    res.json(ventes);
  } catch (err) {
    res.status(500).json({ error: "Erreur recherche ventes ❌" });
  }
});

// 📅 Historique par mois/année
router.get("/historique/:year/:month", protect, async (req, res) => {
  try {
    const { year, month } = req.params;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const articles = await Article.find({
      atelierId: req.user.atelierId,
      createdAt: { $gte: start, $lte: end }
    });

    const ventes = articles.map(a => ({
      _id: a._id,
      nom: a.nom,
      categorie: a.categorie,
      prixUnitaire: a.prix,
      vendu: a.vendu,
      prixTotal: a.vendu * a.prix,
      dateAjout: a.createdAt
    }));

    res.json(ventes);
  } catch (err) {
    res.status(500).json({ error: "Erreur historique ventes ❌" });
  }
});

export default router;
