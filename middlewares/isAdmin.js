import { translate } from "./langMiddleware.js";

// Vérifie que l'utilisateur est admin atelier ou superadmin
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: translate("not_authenticated", req.langue) });
  }

  if (req.user.role === "adminatelier" || req.user.role === "superadmin") {
    return next();
  }

  return res.status(403).json({ error: translate("admin_only", req.langue) });
};

// Vérifie que l'utilisateur est admin atelier uniquement
export const isAdminAtelier = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: translate("not_authenticated", req.langue) });
  }

  if (req.user.role === "adminatelier") {
    return next();
  }

  return res.status(403).json({ error: translate("adminatelier_only", req.langue) });
};

// Vérifie que l'utilisateur est sous-user
export const isSousUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: translate("not_authenticated", req.langue) });
  }

  if (req.user.role === "soususer") {
    return next();
  }

  return res.status(403).json({ error: translate("soususer_only", req.langue) });
};

// Vérifie que l'utilisateur est désactivé
export const isDisabled = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: translate("not_authenticated", req.langue) });
  }

  if (req.user.role === "disabled") {
    return res.status(403).json({ error: translate("account_disabled", req.langue) });
  }

  return next();
};
