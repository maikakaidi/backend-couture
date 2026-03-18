import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Atelier from "../models/Atelier.js";
import Abonnement from "../models/Abonnement.js";

const router = express.Router();

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

// ➕ Créer LE SEUL SUPERADMIN (Maikaka)
router.post("/create-admin", async (req, res) => {
  try {
    // 🔒 Vérifier si un superadmin existe déjà
    const existingSuperadmin = await User.findOne({ role: "superadmin" });
    if (existingSuperadmin) {
      return res.status(403).json({ error: "Superadmin déjà existant ❌" });
    }

    // 🔒 Forcer les valeurs fixes
    const nom = "Maikaka";
    const telephone = "99293329";
    const motDePasse = "gxg123";

    // 🔥 Créer atelier
    const atelier = new Atelier({ nom });
    await atelier.save();

    const superadmin = new User({
      nom,
      telephone,
      motDePasse,
      role: "superadmin",
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
      message: "Superadmin Maikaka créé avec succès 👑",
      token,
      user: superadmin,
    });
  } catch (err) {
    console.error("❌ Erreur création superadmin:", err);
    res.status(500).json({ error: "Erreur serveur ❌" });
  }
});

export default router;
