import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { translate } from "./langMiddleware.js"; // ✅ import traduction

// 🔐 Middleware de protection (authentification)
export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: translate("token_missing", req.langue) });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("❌ Erreur vérification token:", err.message);
      return res.status(401).json({ error: translate("token_invalid", req.langue) });
    }

    const user = await User.findById(decoded.id)
      .select("-motDePasse")
      .populate("atelierId")
      .populate("abonnement");

    if (!user) {
      return res.status(401).json({ error: translate("user_not_found", req.langue) });
    }

    if (user.role === "disabled") {
      return res.status(403).json({ error: translate("account_disabled", req.langue) });
    }

    // ✅ Attacher l’utilisateur au req
    req.user = {
      _id: user._id,
      id: user._id,
      role: user.role,
      atelierId: user.atelierId ? user.atelierId._id : null,
      abonnement: user.abonnement || null,
      nom: user.nom,
      telephone: user.telephone,
      langue: user.langue
    };

    next();
  } catch (error) {
    console.error("❌ Erreur auth middleware:", error.message);
    return res.status(500).json({ error: translate("server_error", req.langue) });
  }
};

// 🛡️ Middleware superadmin uniquement
export const superAdminOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: translate("not_authenticated", req.langue) });
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ error: translate("superadmin_only", req.langue) });
  }
  next();
};

// 🛠️ Middleware admin atelier
export const adminAtelierOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: translate("not_authenticated", req.langue) });
  if (req.user.role !== "adminatelier" && req.user.role !== "superadmin") {
    return res.status(403).json({ error: translate("adminatelier_only", req.langue) });
  }
  next();
};

// 👥 Middleware utilisateurs internes
export const atelierUsers = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: translate("not_authenticated", req.langue) });
  }
  const allowedRoles = ["adminatelier", "soususer", "superadmin"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: translate("access_denied", req.langue) });
  }
  next();
};
