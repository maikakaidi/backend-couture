import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// ➕ Inscription
export const registerUser = async (req, res) => {
  try {
    const { nom, telephone, motDePasse } = req.body;

    // Vérifier champs
    if (!nom || !telephone || !motDePasse) {
      return res.status(400).json({ message: "Nom, téléphone et mot de passe requis ❌" });
    }

    // Vérifier si le téléphone existe déjà
    const userExists = await User.findOne({ telephone });
    if (userExists) {
      return res.status(400).json({ message: "Téléphone déjà utilisé ❌" });
    }

    // Créer l’utilisateur
    const user = await User.create({
      nom,
      telephone,
      motDePasse,
      role: "adminatelier" // ou "user" selon ton besoin
    });

    // Générer un token JWT
    const token = generateToken(user._id);

    res.status(201).json({
      id: user._id,
      nom: user.nom,
      telephone: user.telephone,
      role: user.role,
      token
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur ❌", error: err.message });
  }
};

// 🔑 Connexion
export const loginUser = async (req, res) => {
  try {
    const { telephone, motDePasse } = req.body;

    if (!telephone || !motDePasse) {
      return res.status(400).json({ message: "Téléphone et mot de passe requis ❌" });
    }

    // Trouver l’utilisateur par téléphone
    const user = await User.findOne({ telephone }).select("+motDePasse");

    if (user && (await user.comparePassword(motDePasse))) {
      res.json({
        id: user._id,
        nom: user.nom,
        telephone: user.telephone,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: "Téléphone ou mot de passe invalide ❌" });
    }
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur ❌", error: err.message });
  }
};

// 👤 Profil
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        id: user._id,
        nom: user.nom,
        telephone: user.telephone,
        role: user.role
      });
    } else {
      res.status(404).json({ message: "Utilisateur introuvable ❌" });
    }
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur ❌", error: err.message });
  }
};
