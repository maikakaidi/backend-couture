import express from "express";
import { protect, atelierUsers } from "../middlewares/authMiddleware.js";
import { canInsert, canModifyOrDelete } from "../middlewares/permissions.js";
import Commande from "../models/Commande.js";
import Finance from "../models/Finance.js";
import Abonnement from "../models/Abonnement.js";
import multer from "multer";
import { uploadToCloudinary } from "../utils/cloudinary.js"; // ← importe la fonction Cloudinary

const router = express.Router();

// Configuration Multer temporaire (mémoire suffit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

/* =============================
   LISTE DES COMMANDES (inchangé)
============================= */
router.get("/:clientId", protect, atelierUsers, async (req, res) => {
  try {
    const commandes = await Commande.find({
      clientId: req.params.clientId,
      atelierId: req.user.atelierId
    }).populate("clientId", "nom telephone");

    res.json(commandes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération commandes ❌" });
  }
});

/* =============================
   CREER COMMANDE
============================= */
router.post(
  "/",
  protect,
  canInsert,
  upload.single("commandeImage"),
  async (req, res) => {
    try {
      const { clientId, description, montant, acompte, rdv } = req.body;

      if (!clientId || !description || !montant || !rdv) {
        return res.status(400).json({ error: "Champs obligatoires manquants ❌" });
      }

      // Vérification limite abonnement
      const abonnement = await Abonnement.findOne({ atelierId: req.user.atelierId });
      const count = await Commande.countDocuments({ atelierId: req.user.atelierId });

      if (abonnement?.maxCommandePhotos && count >= abonnement.maxCommandePhotos) {
        return res.status(403).json({ error: "Limite de commandes atteinte ❌" });
      }

      let imageUrl = null;
      if (req.file) {
        imageUrl = await uploadToCloudinary(req.file.buffer, 'commandes');
      }

      const newCommande = await Commande.create({
        clientId,
        description,
        montant,
        acompte,
        rdv,
        image: imageUrl,
        atelierId: req.user.atelierId
      });

      // Enregistrement acompte dans finances
      if (acompte && Number(acompte) > 0) {
        await Finance.create({
          type: "commande",
          montant: acompte,
          description: `Acompte commande ${newCommande._id}`,
          refId: newCommande._id,
          atelierId: req.user.atelierId
        });
      }

      res.status(201).json(newCommande);
    } catch (err) {
      console.error("❌ insertion commande:", err);
      res.status(500).json({ error: "Erreur insertion commande ❌" });
    }
  }
);

/* =============================
   MODIFIER COMMANDE
============================= */
router.put(
  "/:id",
  protect,
  canModifyOrDelete,
  upload.single("commandeImage"),
  async (req, res) => {
    try {
      const updateData = {
        description: req.body.description,
        montant: req.body.montant,
        acompte: req.body.acompte,
        rdv: req.body.rdv
      };

      if (req.file) {
        updateData.image = await uploadToCloudinary(req.file.buffer, 'commandes');
      }

      const updatedCommande = await Commande.findOneAndUpdate(
        { _id: req.params.id, atelierId: req.user.atelierId },
        updateData,
        { new: true }
      );

      res.json(updatedCommande);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur modification commande ❌" });
    }
  }
);

/* =============================
   SUPPRIMER COMMANDE (inchangé)
============================= */
router.delete("/:id", protect, canModifyOrDelete, async (req, res) => {
  try {
    await Commande.findOneAndDelete({ _id: req.params.id, atelierId: req.user.atelierId });
    await Finance.deleteMany({ refId: req.params.id, type: "commande", atelierId: req.user.atelierId });

    res.json({ message: "Commande supprimée ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur suppression ❌" });
  }
});

export default router;
