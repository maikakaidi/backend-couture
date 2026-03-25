import express from "express";
import { protect, atelierUsers } from "../middlewares/authMiddleware.js";
import { canInsert, canModifyOrDelete } from "../middlewares/permissions.js";
import { checkAbonnement } from "../middlewares/checkAbonnement.js";

import Commande from "../models/Commande.js";
import Finance from "../models/Finance.js";

import multer from "multer";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const router = express.Router();

/* =============================
   CONFIG MULTER
============================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Fichier non image ❌"));
    }
    cb(null, true);
  },
});


/* =============================
   LISTE COMMANDES
============================= */
router.get(
  "/:clientId",
  protect,
  atelierUsers,
  checkAbonnement,
  async (req, res) => {
    try {
      const commandes = await Commande.find({
        clientId: req.params.clientId,
        atelierId: req.user.atelierId,
      }).populate("clientId", "nom telephone");

      res.json(commandes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur récupération commandes ❌" });
    }
  }
);


/* =============================
   CREER COMMANDE
============================= */
router.post(
  "/",
  protect,
  atelierUsers,
  checkAbonnement,
  canInsert,
  upload.single("commandeImage"),
  async (req, res) => {
    try {
      const { clientId, description, montant, acompte, rdv } = req.body;

      if (!clientId || !description || !montant || !rdv) {
        return res.status(400).json({
          error: "Champs obligatoires manquants ❌",
        });
      }

      /* ===== Vérification abonnement ===== */
      const abonnement = req.abonnement;

      if (!abonnement || !abonnement.estValide()) {
        return res.status(403).json({
          error: "Abonnement expiré ❌",
        });
      }

      /* ===== Limite commandes ===== */
      const totalCommandes = await Commande.countDocuments({
        atelierId: req.user.atelierId,
      });

      if (
        abonnement.maxCommandePhotos > 0 &&
        totalCommandes >= abonnement.maxCommandePhotos
      ) {
        return res.status(403).json({
          error: "Limite de commandes atteinte ❌",
        });
      }

      /* ===== Upload image ===== */
      let imageUrl = null;

      if (req.file) {
        try {
          imageUrl = await uploadToCloudinary(
            req.file.buffer,
            "commandes"
          );
        } catch (uploadErr) {
          console.error("Cloudinary error:", uploadErr);
          return res.status(500).json({
            error: "Erreur upload image ❌",
          });
        }
      }

      /* ===== Création ===== */
      const newCommande = await Commande.create({
        clientId,
        description,
        montant,
        acompte,
        rdv,
        image: imageUrl,
        atelierId: req.user.atelierId,
      });

      /* ===== Finance ===== */
      if (acompte && Number(acompte) > 0) {
        await Finance.create({
          type: "commande",
          montant: acompte,
          description: `Acompte commande ${newCommande._id}`,
          refId: newCommande._id,
          atelierId: req.user.atelierId,
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
  atelierUsers,
  checkAbonnement,
  canModifyOrDelete,
  upload.single("commandeImage"),
  async (req, res) => {
    try {
      const updateData = {};

      ["description", "montant", "acompte", "rdv"].forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      if (req.file) {
        updateData.image = await uploadToCloudinary(
          req.file.buffer,
          "commandes"
        );
      }

      const updatedCommande = await Commande.findOneAndUpdate(
        {
          _id: req.params.id,
          atelierId: req.user.atelierId,
        },
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
   SUPPRIMER COMMANDE
============================= */
router.delete(
  "/:id",
  protect,
  atelierUsers,
  checkAbonnement,
  canModifyOrDelete,
  async (req, res) => {
    try {
      await Commande.findOneAndDelete({
        _id: req.params.id,
        atelierId: req.user.atelierId,
      });

      await Finance.deleteMany({
        refId: req.params.id,
        type: "commande",
        atelierId: req.user.atelierId,
      });

      res.json({ message: "Commande supprimée ✅" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur suppression ❌" });
    }
  }
);

export default router;
