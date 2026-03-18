// Vérifie si l'utilisateur est adminatelier ou superadmin
export const isAdminOrCanModify = (req, res, next) => {
  try {
    const user = req.user;
    console.log("DEBUG isAdminOrCanModify ROLE:", user?.role);

    if (!user) {
      return res.status(401).json({ error: "Utilisateur non authentifié ❌" });
    }

    if (user.role === "adminatelier" || user.role === "superadmin") {
      return next();
    }

    return res.status(403).json({ error: "Accès interdit ❌" });
  } catch (err) {
    console.error("Erreur permissions:", err);
    res.status(500).json({ error: "Erreur permissions ❌" });
  }
};

// Vérifie si l'utilisateur peut modifier (adminatelier et superadmin uniquement)
export const canModify = (req, res, next) => {
  try {
    const user = req.user;
    console.log("DEBUG canModify ROLE:", user?.role);

    if (!user) {
      return res.status(401).json({ error: "Utilisateur non authentifié ❌" });
    }

    if (user.role === "adminatelier" || user.role === "superadmin") {
      return next();
    }

    return res.status(403).json({ error: "Modification non autorisée ❌" });
  } catch (err) {
    console.error("Erreur permissions:", err);
    res.status(500).json({ error: "Erreur permissions ❌" });
  }
};

// 🔹 Autoriser insertion (adminatelier et soususer)
export const canInsert = (req, res, next) => {
  try {
    const user = req.user;
    console.log("DEBUG canInsert ROLE:", user?.role);

    if (!user) {
      return res.status(401).json({ error: "Utilisateur non authentifié ❌" });
    }

    if (user.role === "adminatelier" || user.role === "soususer") {
      return next();
    }

    return res.status(403).json({ error: "Insertion non autorisée ❌" });
  } catch (err) {
    console.error("Erreur permissions:", err);
    res.status(500).json({ error: "Erreur permissions ❌" });
  }
};

// 🔹 Autoriser modification/suppression (adminatelier et superadmin uniquement)
export const canModifyOrDelete = (req, res, next) => {
  try {
    const user = req.user;
    console.log("DEBUG canModifyOrDelete ROLE:", user?.role);

    if (!user) {
      return res.status(401).json({ error: "Utilisateur non authentifié ❌" });
    }

    if (user.role === "adminatelier" || user.role === "superadmin") {
      return next();
    }

    return res.status(403).json({ error: "Seul l’admin peut modifier/supprimer ❌" });
  } catch (err) {
    console.error("Erreur permissions:", err);
    res.status(500).json({ error: "Erreur permissions ❌" });
  }
};
