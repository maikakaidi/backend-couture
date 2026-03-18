import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Atelier from "../models/Atelier.js";
import Abonnement from "../models/Abonnement.js";

const router = express.Router();

// 🔑 Générer un token COMPLET
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      atelierId: user.atelierId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// ➕ Créer SUPERADMIN (pas adminatelier)
router.post("/create-admin", async (req, res) => {
  try {
    console.log("📩 Create-admin reçu:", req.body);

    const { nom, telephone, motDePasse } = req.body;

    if (!nom || !telephone || !motDePasse) {
      return res.status(400).json({
        error: "Tous les champs sont obligatoires ❌",
      });
    }

    const exists = await User.findOne({ telephone });
    if (exists) {
      return res.status(400).json({
        error: "Utilisateur déjà existant ❌",
      });
    }

    // 🔥 Créer atelier
    const atelier = new Atelier({ nom });
    await atelier.save();

    // 🔥 ROLE CORRIGÉ → superadmin
    const superadmin = new User({
      nom,
      telephone,
      motDePasse,
      role: "superadmin", // ✅ CORRIGÉ
      atelierId: atelier._id,
    });

    await superadmin.save();

    // Lier atelier
    atelier.adminId = superadmin._id;
    atelier.utilisateurs.push(superadmin._id);
    await atelier.save();

    // Abonnement essai
    const dateDebut = new Date();
    const dateFin = new Date();
    dateFin.setDate(dateDebut.getDate() + 7);

    const abonnement = new Abonnement({
      atelierId: atelier._id,
      type: "essai",
      actif: true,
      dateDebut,
      dateFin,
      utilisateursInclus: 1,
    });

    await abonnement.save();

    superadmin.abonnement = abonnement._id;
    await superadmin.save();

    atelier.abonnement = abonnement._id;
    await atelier.save();

    const token = generateToken(superadmin);

    res.status(201).json({
      message: "Superadmin créé avec succès 👑",
      token,
      user: superadmin,
    });
  } catch (err) {
    console.error("❌ Erreur création admin:", err);
    res.status(500).json({ error: "Erreur serveur ❌" });
  }
});

export default router;

