import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ✅ Vérifie que l'utilisateur est authentifié via JWT
export const verifyToken = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Extraire le token
      token = req.headers.authorization.split(" ")[1];

      // Vérifier et décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Charger l'utilisateur sans mot de passe
      req.user = await User.findById(decoded.id).select("-motDePasse");

      if (!req.user) {
        return res.status(401).json({ error: "Utilisateur introuvable ❌" });
      }

      // ✅ Passe au middleware suivant
      next();
    } catch (error) {
      return res.status(401).json({ error: "Token invalide ou expiré ❌" });
    }
  } else {
    return res.status(401).json({ error: "Pas de token fourni ❌" });
  }
};
