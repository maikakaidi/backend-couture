import express from "express";
import Galerie from "../models/Galerie.js";
import upload from "../config/multer.js";
import { protect } from "../middlewares/authMiddleware.js";
import { canInsert, canModifyOrDelete } from "../middlewares/permissions.js";
import Abonnement from "../models/Abonnement.js";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const router = express.Router();

// Liste
router.get("/", protect, async (req, res) => {
  try {
    const images = await Galerie.find({ atelierId: req.user.atelierId }).sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération galerie" });
  }
});

// Upload
router.post("/upload", protect, canInsert, upload.single("imageGalerie"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });

    const abonnement = await Abonnement.findOne({ atelierId: req.user.atelierId });
    const count = await Galerie.countDocuments({ atelierId: req.user.atelierId });

    if (abonnement && count >= abonnement.maxGaleriePhotos) {
      return res.status(403).json({ error: "Limite atteinte pour la galerie" });
    }

    const inputPath = req.file.path;
    const compressedFilename = "compressed-" + req.file.filename;
    const compressedPath = path.join(path.dirname(inputPath), compressedFilename);

    // Compression dans un fichier différent (fix "same file")
    await sharp(inputPath)
      .resize(800)
      .jpeg({ quality: 80 })
      .toFile(compressedPath);

    // Supprimer original
    fs.unlink(inputPath, (err) => {
      if (err) console.warn("⚠️ unlink warning:", err.message);
    });

    const relativePath = `/uploads/galerie/${compressedFilename}`;

    const newImage = new Galerie({
      filename: relativePath,
      titre: req.body.titre || null,
      categorie: req.body.categorie || "Divers",
      atelierId: req.user.atelierId
    });

    await newImage.save();
    res.json({ message: "Image uploadée ✅", image: newImage });
  } catch (err) {
    console.error("Erreur upload galerie:", err);
    res.status(500).json({ error: "Erreur upload image" });
  }
});

// Supprimer
router.delete("/:id", protect, canModifyOrDelete, async (req, res) => {
  try {
    await Galerie.findOneAndDelete({ _id: req.params.id, atelierId: req.user.atelierId });
    res.json({ message: "Image supprimée ✅" });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression image" });
  }
});

export default router;
