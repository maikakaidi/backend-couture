import User from "../models/User.js";
import jwt from "jsonwebtoken";

// 🔐 Générer token
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

// 📝 INSCRIPTION (user normal seulement)
export const registerUser = async (req, res) => {
  try {
    const { nom, telephone, motDePasse, atelierId } = req.body;

    if (!nom || !telephone || !motDePasse || !atelierId) {
      return res.status(400).json({ error: "Tous les champs sont obligatoires" });
    }

    // Vérifier si user existe
    const exist = await User.findOne({ telephone });
    if (exist) {
      return res.status(400).json({ error: "Ce numéro existe déjà" });
    }

    // ⚠️ Toujours créer en USER (pas admin)
    const user = await User.create({
      nom,
      telephone,
      motDePasse,
      role: "user",
      atelierId,
    });

    const token = generateToken(user);

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      token,
      user,
    });
  } catch (error) {
    console.error("Erreur register:", error);
    res.status(500).json({ error: "Erreur serveur inscription" });
  }
};

// 🔑 CONNEXION (telephone + motDePasse)
export const loginUser = async (req, res) => {
  try {
    const { telephone, motDePasse } = req.body;

    if (!telephone || !motDePasse) {
      return res.status(400).json({ error: "Téléphone et mot de passe requis" });
    }

    const user = await User.findOne({ telephone });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    if (user.role === "disabled") {
      return res.status(403).json({ error: "Compte désactivé" });
    }

    // Vérifier mot de passe (méthode du model)
    const isMatch = await user.comparePassword(motDePasse);

    if (!isMatch) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    const token = generateToken(user);

    res.json({
      message: "Connexion réussie",
      token,
      user,
    });
  } catch (error) {
    console.error("Erreur login:", error);
    res.status(500).json({ error: "Erreur serveur connexion" });
  }
};
