import Abonnement from "../models/Abonnement.js";

export const checkAbonnement = async (req, res, next) => {
  try {
    const abonnement = await Abonnement.findOne({
      atelierId: req.user.atelierId
    });

    // aucun abonnement
    if (!abonnement) {
      return res.status(403).json({
        error: "Aucun abonnement actif ❌"
      });
    }

    // abonnement expiré
    if (
      abonnement.dateFin &&
      new Date(abonnement.dateFin) < new Date()
    ) {
      return res.status(403).json({
        error: "Abonnement expiré ❌"
      });
    }

    // on garde abonnement accessible
    req.abonnement = abonnement;

    next();
  } catch (err) {
    console.error("Erreur check abonnement:", err);
    res.status(500).json({ error: "Erreur abonnement ❌" });
  }
};
