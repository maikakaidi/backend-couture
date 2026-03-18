import express from "express";
import User from "../models/User.js";
import Abonnement from "../models/Abonnement.js";
import bcrypt from "bcryptjs";
import { verifyToken } from "../middlewares/verifyToken.js";
import { isAdmin, isAdminAtelier } from "../middlewares/isAdmin.js";

const router = express.Router();

/* =====================================================
   👥 LISTE UTILISATEURS (ORDRE PAR ADMIN ATELIER)
===================================================== */
router.get("/users", verifyToken, isAdmin, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "adminatelier") {
      query = { atelierId: req.user.atelierId };
    }

    const users = await User.find(query)
      .populate("abonnement")
      .lean();

    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        if (u.role === "adminatelier" && u.abonnement?.actif) {
          const sousUsersCount = await User.countDocuments({
            atelierId: u.atelierId,
            role: "soususer",
            statut: "valide",
          });
          u.abonnement.compteur = sousUsersCount + 1;
        }
        return u;
      })
    );

    const superadmins = enrichedUsers.filter((u) => u.role === "superadmin");
    const admins = enrichedUsers.filter((u) => u.role === "adminatelier");
    const autresUsers = enrichedUsers.filter(
      (u) => !["superadmin", "adminatelier"].includes(u.role)
    );

    let orderedUsers = [...superadmins];
    admins.forEach((admin) => {
      orderedUsers.push(admin);
      const sousUsers = autresUsers.filter(
        (u) => String(u.atelierId) === String(admin.atelierId)
      );
      orderedUsers.push(...sousUsers);
    });

    res.json(orderedUsers);
  } catch (err) {
    console.error("❌ Erreur récupération utilisateurs:", err);
    res.status(500).json({ error: "Erreur récupération utilisateurs ❌" });
  }
});

/* =====================================================
   🔍 RECHERCHE ATELIER
===================================================== */
router.get("/users/search", verifyToken, isAdmin, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Paramètre de recherche manquant ❌" });
    }

    const ateliers = await User.find({
      role: "adminatelier",
      $or: [{ nom: new RegExp(q, "i") }, { telephone: new RegExp(q, "i") }],
    }).populate("abonnement");

    res.json(ateliers);
  } catch (err) {
    console.error("❌ Erreur recherche atelier:", err);
    res.status(500).json({ error: "Erreur recherche atelier ❌" });
  }
});

/* =====================================================
   ✅ ACTIVER ABONNEMENT / ACTIVER SOUSUSER
===================================================== */
router.put("/abonnements/activer/:userId", verifyToken, isAdmin, async (req, res) => {
  try {
    const { type } = req.body;
    let query = { _id: req.params.userId };

    if (req.user.role === "adminatelier") {
      query.atelierId = req.user.atelierId;
    }

    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable ❌" });
    if (user.role === "superadmin")
      return res.status(400).json({ error: "Le superadmin n'a pas besoin d'abonnement ❌" });

    if (user.role === "soususer") {
      if (type !== "activation") {
        return res.status(400).json({ error: "Soususer ne peut avoir qu'une activation ❌" });
      }
      user.statut = "valide";
      await user.save();
      return res.json({ message: "Activation du soususer confirmée ✅", user });
    }

    const dateDebut = new Date();
    let dateFin;
    if (type === "3mois") {
      dateFin = new Date();
      dateFin.setMonth(dateDebut.getMonth() + 3);
    } else if (type === "6mois") {
      dateFin = new Date();
      dateFin.setMonth(dateDebut.getMonth() + 6);
    } else if (type === "1an") {
      dateFin = new Date();
      dateFin.setFullYear(dateDebut.getFullYear() + 1);
    } else {
      return res.status(400).json({ error: "Type invalide ❌" });
    }

    const abonnement = await Abonnement.findOneAndUpdate(
      { atelierId: user.atelierId },
      { type, actif: true, dateDebut, dateFin },
      { new: true, upsert: true }
    );

    user.abonnement = abonnement._id;
    await user.save();

    res.json({ message: `Abonnement ${type} activé ✅`, abonnement });
  } catch (err) {
    console.error("❌ Erreur activation abonnement:", err);
    res.status(500).json({ error: "Erreur activation abonnement ❌" });
  }
});

/* =====================================================
   🔑 RESET PASSWORD
===================================================== */
router.post("/users/reset-password/:userId", verifyToken, isAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ error: "Nouveau mot de passe requis ❌" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(req.params.userId, { motDePasse: hashedPassword });
    res.json({ message: "Mot de passe réinitialisé ✅" });
  } catch (err) {
    console.error("❌ Erreur reset password:", err);
    res.status(500).json({ error: "Erreur reset password ❌" });
  }
});

/* =====================================================
   ✅ ACTIVER / DÉSACTIVER UTILISATEUR
===================================================== */
router.patch("/users/status/:userId", verifyToken, isAdmin, async (req, res) => {
  try {
    const { statut } = req.body;
    if (!["valide", "disabled"].includes(statut)) {
      return res.status(400).json({ error: "Statut invalide ❌" });
    }

    const user = await User.findByIdAndUpdate(req.params.userId, { statut }, { new: true });
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable ❌" });

    res.json({ message: `Utilisateur ${statut} ✅`, user });
  } catch (err) {
    console.error("❌ Erreur changement statut:", err);
    res.status(500).json({ error: "Erreur changement statut ❌" });
  }
});

/* =====================================================
   🚮 SUPPRIMER UTILISATEUR
===================================================== */
router.delete("/users/delete/:userId", verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé ❌" });
    if (user.role === "superadmin")
      return res.status(400).json({ error: "Impossible de supprimer le superadmin ❌" });

    if (["adminatelier", "soususer"].includes(user.role)) {
      await User.findByIdAndDelete(req.params.userId);
      return res.json({ message: `${user.role} supprimé ✅` });
    }

    res.status(400).json({ error: "Suppression non autorisée ❌" });
  } catch (err) {
    console.error("❌ Erreur suppression utilisateur:", err);
    res.status(500).json({ error: "Erreur suppression utilisateur ❌" });
  }
});

/* =====================================================
   📊 STATS GLOBALES
===================================================== */
router.get("/stats", verifyToken, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: "adminatelier" });
    const totalSousUsers = await User.countDocuments({ role: "soususer" });
    const abonnementsActifs = await Abonnement.countDocuments({ actif: true });
    const abonnementsInactifs = await Abonnement.countDocuments({ actif: false });

    res.json({
      totalUsers,
      totalAdmins,
      totalSousUsers,
      abonnementsActifs,
      abonnementsInactifs,
    });
  } catch (err) {
    console.error("❌ Erreur stats:", err);
    res.status(500).json({ error: "Erreur récupération stats ❌" });
  }
});

/* =====================================================
   📈 STATS MENSUELLES (inscriptions + abonnements)
===================================================== */
router.get("/stats/monthly", verifyToken, isAdmin, async (req, res) => {
  try {
    // Inscriptions par mois (nouveaux ateliers)
    const inscriptions = await User.aggregate([
      {
        $match: {
          role: "adminatelier",
          createdAt: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          inscriptions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Abonnements activés par mois
    const abonnements = await Abonnement.aggregate([
      {
        $match: {
          actif: true,
          dateDebut: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$dateDebut" } },
          abonnements: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fusionner les deux résultats (mois manquants = 0)
    const allMonths = new Set([
      ...inscriptions.map(i => i._id),
      ...abonnements.map(a => a._id)
    ]);

    const monthlyStats = Array.from(allMonths)
      .sort()
      .map(mois => ({
        mois,
        inscriptions: inscriptions.find(i => i._id === mois)?.inscriptions || 0,
        abonnements: abonnements.find(a => a._id === mois)?.abonnements || 0
      }));

    res.json(monthlyStats);
  } catch (err) {
    console.error("Erreur stats mensuelles:", err);
    res.status(500).json({ error: "Erreur stats mensuelles" });
  }
});

/* =====================================================
   💰 REVENUS ESTIMÉS (total abonnements payés)
===================================================== */
router.get("/stats/revenus", verifyToken, isAdmin, async (req, res) => {
  try {
    // Prix estimés par plan (ajuste selon tes vrais prix)
    const prixPlans = {
      "3mois": 30000,
      "6mois": 40000,
      "1an": 60000
    };

    const abonnements = await Abonnement.find({ actif: true });

    const revenusTotaux = abonnements.reduce((total, abo) => {
      const prix = prixPlans[abo.type] || 0;
      return total + prix;
    }, 0);

    res.json({ revenusTotaux });
  } catch (err) {
    console.error("Erreur revenus:", err);
    res.status(500).json({ error: "Erreur calcul revenus" });
  }
});


export default router;
