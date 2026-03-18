import express from "express";
import Article from "../models/Article.js";
import Depense from "../models/Depense.js";
import Employee from "../models/Employee.js";
import Commande from "../models/Commande.js";
import { protect, atelierUsers } from "../middlewares/authMiddleware.js";
import { canModify } from "../middlewares/permissions.js";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek.js";

dayjs.extend(isoWeek);

const router = express.Router();

// 📊 Récupérer finances par période (lecture pour tous les utilisateurs internes)
router.get("/", protect, atelierUsers, async (req, res) => {
  try {
    const periode = req.query.periode || "mois"; // jour, semaine, mois, annee
    const today = dayjs();
    const thisMonth = today.month();
    const thisYear = today.year();
    const thisWeek = today.isoWeek();

    // ✅ Isolation par atelier
    const articles = await Article.find({ atelierId: req.user.atelierId });
    const depenses = await Depense.find({ atelierId: req.user.atelierId });
    const employes = await Employee.find({ atelierId: req.user.atelierId });
    const commandes = await Commande.find({ atelierId: req.user.atelierId });

    // ✅ Recettes par période (ventes + commandes)
    let recettes = 0;
    if (periode === "jour") {
      recettes =
        articles.filter(a => dayjs(a.dateAjout).isSame(today, "day"))
          .reduce((sum, a) => sum + (a.vendu * a.prix), 0) +
        commandes.filter(c => dayjs(c.createdAt).isSame(today, "day"))
          .reduce((sum, c) => sum + c.montant, 0);
    } else if (periode === "semaine") {
      recettes =
        articles.filter(a => dayjs(a.dateAjout).isoWeek() === thisWeek)
          .reduce((sum, a) => sum + (a.vendu * a.prix), 0) +
        commandes.filter(c => dayjs(c.createdAt).isoWeek() === thisWeek)
          .reduce((sum, c) => sum + c.montant, 0);
    } else if (periode === "mois") {
      recettes =
        articles.filter(a => dayjs(a.dateAjout).month() === thisMonth)
          .reduce((sum, a) => sum + (a.vendu * a.prix), 0) +
        commandes.filter(c => dayjs(c.createdAt).month() === thisMonth)
          .reduce((sum, c) => sum + c.montant, 0);
    } else if (periode === "annee") {
      recettes =
        articles.filter(a => dayjs(a.dateAjout).year() === thisYear)
          .reduce((sum, a) => sum + (a.vendu * a.prix), 0) +
        commandes.filter(c => dayjs(c.createdAt).year() === thisYear)
          .reduce((sum, c) => sum + c.montant, 0);
    }

    // ✅ Dépenses (par période si besoin)
    const totalDepenses = depenses
      .filter(d => {
        if (periode === "jour") return dayjs(d.createdAt).isSame(today, "day");
        if (periode === "semaine") return dayjs(d.createdAt).isoWeek() === thisWeek;
        if (periode === "mois") return dayjs(d.createdAt).month() === thisMonth;
        if (periode === "annee") return dayjs(d.createdAt).year() === thisYear;
        return true;
      })
      .reduce((acc, d) => acc + d.montant, 0);

    // ✅ Employés (salaires + avances)
    const masseSalariale = employes.reduce((acc, e) => acc + e.salaire, 0);
    const totalAvancesEmployes = employes.reduce(
      (acc, e) => acc + e.advances.reduce((sum, a) => sum + a.amount, 0),
      0
    );

    // ✅ Commandes (montant + acomptes)
    const totalCommandes = commandes.reduce((acc, c) => acc + c.montant, 0);
    const totalAcomptesCommandes = commandes.reduce((acc, c) => acc + c.acompte, 0);

    // ✅ Valeur du stock
    const valeurStock = articles.reduce((acc, a) => acc + (a.stock * a.prix), 0);

    // ✅ Chiffre d’affaires global (filtré par période)
    const chiffreAffaires = articles
      .filter(a => {
        if (periode === "jour") return dayjs(a.dateAjout).isSame(today, "day");
        if (periode === "semaine") return dayjs(a.dateAjout).isoWeek() === thisWeek;
        if (periode === "mois") return dayjs(a.dateAjout).month() === thisMonth;
        if (periode === "annee") return dayjs(a.dateAjout).year() === thisYear;
        return true;
      })
      .reduce((acc, a) => acc + (a.vendu * a.prix), 0);

    // ✅ Bénéfice net (par période)
    const beneficeNet = chiffreAffaires - (totalDepenses + masseSalariale + totalAvancesEmployes);

    res.json({
      atelierId: req.user.atelierId,
      periode,
      recettes,
      valeurStock,
      chiffreAffaires,
      totalDepenses,
      masseSalariale,
      totalAvancesEmployes,
      totalCommandes,
      totalAcomptesCommandes,
      beneficeNet
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération finances ❌" });
  }
});

// ➕ Ajouter une dépense
router.post("/depense", protect, atelierUsers, async (req, res) => {
  try {
    const { description, montant } = req.body;
    const depense = new Depense({
      description,
      montant,
      atelierId: req.user.atelierId
    });
    await depense.save();
    res.json({ message: "Dépense ajoutée ✅", depense });
  } catch (err) {
    res.status(500).json({ error: "Erreur ajout dépense ❌" });
  }
});

// ✏️ Modifier une dépense
router.put("/depense/:id", protect, canModify, async (req, res) => {
  try {
    const depense = await Depense.findOneAndUpdate(
      { _id: req.params.id, atelierId: req.user.atelierId },
      req.body,
      { new: true }
    );
    if (!depense) return res.status(404).json({ error: "Dépense introuvable ❌" });
    res.json({ message: "Dépense modifiée ✅", depense });
  } catch (err) {
    res.status(500).json({ error: "Erreur modification dépense ❌" });
  }
});

// ❌ Supprimer une dépense
router.delete("/depense/:id", protect, canModify, async (req, res) => {
  try {
    const depense = await Depense.findOneAndDelete({ _id: req.params.id, atelierId: req.user.atelierId });
    if (!depense) return res.status(404).json({ error: "Dépense introuvable ❌" });
    res.json({ message: "Dépense supprimée ✅" });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression dépense ❌" });
  }
});

export default router;
