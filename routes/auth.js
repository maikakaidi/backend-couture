import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Abonnement from "../models/Abonnement.js";
import Atelier from "../models/Atelier.js";
import { protect } from "../middlewares/authMiddleware.js";
import { isAdminAtelier } from "../middlewares/isAdmin.js"; 
import rateLimit from "express-rate-limit";
import { translate, detectLangMiddleware } from "../middlewares/langMiddleware.js";

const router = express.Router();

// ✅ appliquer le middleware de détection de langue
router.use(detectLangMiddleware);

// 🔒 Limiter les tentatives de login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: translate("too_many_attempts", "fr") },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔑 Générer un token JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, atelierId: user.atelierId },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// ===============================
// ➕ REGISTER ADMIN ATELIER
// ===============================
router.post("/register", async (req, res, next) => {
  try {
    const { nom, telephone, motDePasse } = req.body;

    if (!nom || !telephone || !motDePasse) {
      return res.status(400).json({ error: translate("fields_required", req.langue) });
    }

    if (motDePasse.length < 6) {
      return res.status(400).json({ error: translate("password_too_short", req.langue) });
    }

    const userExists = await User.findOne({ telephone });
    if (userExists) {
      return res.status(400).json({ error: translate("user_exists", req.langue) });
    }

    const atelier = new Atelier({ nom, adminId: null, utilisateurs: [] });
    await atelier.save();

    const user = new User({
      nom,
      telephone,
      motDePasse,
      role: "adminatelier",
      atelierId: atelier._id,
      langue: req.langue
    });

    await user.save();

    atelier.adminId = user._id;
    atelier.utilisateurs.push(user._id);
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
      utilisateursPayants: 0,
    });

    await abonnement.save();

    user.abonnement = abonnement._id;
    await user.save();

    atelier.abonnement = abonnement._id;
    await atelier.save();

    const token = generateToken(user);

    res.status(201).json({
      message: translate("admin_created", req.langue),
      token,
      user,
    });
  } catch (err) {
    console.error("❌ Erreur register:", err.message);
    next(err); // ✅ envoie au middleware global
  }
});

// ===============================
// ➕ REGISTER SOUS-USER
// ===============================
router.post("/register-soususer", protect, isAdminAtelier, async (req, res, next) => {
  try {
    const { nom, telephone, motDePasse } = req.body;

    if (!nom || !telephone || !motDePasse) {
      return res.status(400).json({ error: translate("fields_required", req.langue) });
    }

    if (motDePasse.length < 6) {
      return res.status(400).json({ error: translate("password_too_short", req.langue) });
    }

    const newUser = new User({
      nom,
      telephone,
      motDePasse,
      role: "soususer",
      atelierId: req.user.atelierId,
      abonnement: req.user.abonnement || null,
      langue: req.langue
    });

    await newUser.save();

    await Atelier.findByIdAndUpdate(req.user.atelierId, {
      $push: { utilisateurs: newUser._id },
    });

    res.status(201).json({
      message: translate("user_created", req.langue),
      user: newUser,
    });
  } catch (err) {
    console.error("❌ Erreur register-soususer:", err.message);
    next(err);
  }
});

// ===============================
// 🔐 LOGIN (admin atelier + soususer)
// ===============================
router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { telephone, motDePasse } = req.body;

    const user = await User.findOne({ telephone })
      .select("+motDePasse")
      .populate("abonnement")
      .populate("atelierId");

    if (!user) {
      return res.status(400).json({ error: translate("user_not_found", req.langue) });
    }

    const isMatch = await user.comparePassword(motDePasse);
    if (!isMatch) {
      return res.status(400).json({ error: translate("wrong_password", req.langue) });
    }

    const token = generateToken(user);

    res.json({
      message: translate("login_success", req.langue),
      token,
      user,
      role: user.role,
    });
  } catch (err) {
    console.error("❌ Erreur login:", err.message);
    next(err);
  }
});

// ===============================
// 🔐 LOGIN SUPERADMIN
// ===============================
router.post("/login-superadmin", loginLimiter, async (req, res, next) => {
  try {
    const { motDePasse } = req.body;

    const superadmin = await User.findOne({ telephone: "99293329", role: "superadmin" }).select("+motDePasse");
    if (!superadmin) {
      return res.status(404).json({ error: translate("user_not_found", req.langue) });
    }

    const isMatch = await superadmin.comparePassword(motDePasse);
    if (!isMatch) {
      return res.status(401).json({ error: translate("wrong_password", req.langue) });
    }

    const token = generateToken(superadmin);

    res.json({
      message: translate("login_success", req.langue),
      token,
      user: superadmin,
    });
  } catch (err) {
    console.error("❌ Erreur login-superadmin:", err.message);
    next(err);
  }
});

// 🌍 Modifier la langue préférée d’un utilisateur
router.patch("/users/:id/langue", async (req, res, next) => {
  try {
    const { langue } = req.body;

    if (!["fr", "en", "ar"].includes(langue)) {
      return res.status(400).json({ error: translate("invalid_language", "fr") });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: translate("user_not_found", "fr") });
    }

    user.langue = langue;
    await user.save();

    res.json({ message: translate("language_updated", langue), user });
  } catch (err) {
    console.error("❌ Erreur update-langue:", err.message);
    next(err);
  }
});

export default router;
