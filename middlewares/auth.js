import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Abonnement from "../models/Abonnement.js";
import Atelier from "../models/Atelier.js";
import { translate, detectLangMiddleware } from "../middlewares/langMiddleware.js"; 

const router = express.Router();

// ✅ appliquer le middleware de détection de langue à toutes les routes
router.use(detectLangMiddleware);

// 🔑 Générer un token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ➕ Register admin atelier
router.post("/register", async (req, res) => {
  try {
    const { nom, telephone, motDePasse } = req.body;

    const userExists = await User.findOne({ telephone });
    if (userExists) {
      return res.status(400).json({ error: translate("user_exists", req.langue) });
    }

    const atelier = new Atelier({ nom, adminId: null });
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

    const dateDebut = new Date();
    const dateFin = new Date(dateDebut);
    dateFin.setDate(dateDebut.getDate() + 7);

    const abonnementEssai = new Abonnement({
      atelierId: atelier._id,
      type: "essai",
      actif: true,
      dateDebut,
      dateFin,
      utilisateursInclus: 1
    });
    await abonnementEssai.save();

    user.abonnement = abonnementEssai._id;
    await user.save();
    atelier.abonnement = abonnementEssai._id;
    await atelier.save();

    const token = generateToken(user._id);

    res.status(201).json({ message: translate("admin_created", req.langue), token, user });
  } catch (err) {
    res.status(500).json({ error: translate("server_error", req.langue) });
  }
});

// ➕ Register superadmin
router.post("/register-superadmin", async (req, res) => {
  try {
    const { nom, telephone, motDePasse } = req.body;

    const userExists = await User.findOne({ telephone });
    if (userExists) {
      return res.status(400).json({ error: translate("user_exists", req.langue) });
    }

    const user = new User({
      nom,
      telephone,
      motDePasse,
      role: "superadmin",
      atelierId: req.body.atelierId || new Atelier({ nom: "SuperadminAtelier" })._id,
      langue: req.langue
    });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({ message: translate("superadmin_created", req.langue), token, user });
  } catch (err) {
    res.status(500).json({ error: translate("server_error", req.langue) });
  }
});

// ➕ Register sous-user
router.post("/register-user", async (req, res) => {
  try {
    const { nom, telephone, motDePasse, atelierId } = req.body;

    if (!atelierId) {
      return res.status(400).json({ error: translate("atelier_required", req.langue) });
    }

    const userExists = await User.findOne({ telephone });
    if (userExists) {
      return res.status(400).json({ error: translate("user_exists", req.langue) });
    }

    const user = new User({
      nom,
      telephone,
      motDePasse,
      role: "soususer",
      atelierId,
      langue: req.langue
    });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({ message: translate("user_created", req.langue), token, user });
  } catch (err) {
    res.status(500).json({ error: translate("server_error", req.langue) });
  }
});

// 🔑 Login (sans session unique)
router.post("/login", async (req, res) => {
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

    const token = generateToken(user._id);

    res.json({ message: translate("login_success", req.langue), token, user });
  } catch (err) {
    res.status(500).json({ error: translate("server_error", req.langue) });
  }
});

// 🔒 Logout
router.post("/logout", async (req, res) => {
  try {
    res.json({ message: translate("logout_success", req.langue) });
  } catch (err) {
    res.status(500).json({ error: translate("server_error", req.langue) });
  }
});

export default router;
