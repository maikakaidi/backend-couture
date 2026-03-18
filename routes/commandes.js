import express from "express";
import sharp from "sharp";
import fs from "fs";
import path from "path";

import { protect, atelierUsers } from "../middlewares/authMiddleware.js";
import { canInsert, canModifyOrDelete } from "../middlewares/permissions.js";

import Commande from "../models/Commande.js";
import Finance from "../models/Finance.js";
import Abonnement from "../models/Abonnement.js";

import upload from "../config/multer.js";

const router = express.Router();

/* =============================
   LISTE DES COMMANDES
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

      // Traitement image
      let imageUrl = null;
      if (req.file) {
        const inputPath = req.file.path;
        const outputDir = path.dirname(inputPath);
        const outputFilename = "compressed-" + req.file.filename;
        const outputPath = path.join(outputDir, outputFilename);

        // Compression avec Sharp
        await sharp(inputPath)
          .resize({ width: 800, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(outputPath);

        // Supprimer l'original uniquement après avoir créé le fichier compressé
        fs.unlink(inputPath, err => {
          if (err) console.warn("⚠️ unlink warning:", err.message);
        });

        // chemin relatif pour React
        imageUrl = `/uploads/commandes/${outputFilename}`;
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
        const inputPath = req.file.path;
        const outputDir = path.dirname(inputPath);
        const outputFilename = "compressed-" + req.file.filename;
        const outputPath = path.join(outputDir, outputFilename);

        await sharp(inputPath)
          .resize({ width: 800, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(outputPath);

        fs.unlink(inputPath, err => {
          if (err) console.warn("⚠️ unlink warning:", err.message);
        });

        updateData.image = `/uploads/commandes/${outputFilename}`;
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
   SUPPRIMER COMMANDE
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
