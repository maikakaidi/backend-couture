import express from "express";
import Galerie from "../models/Galerie.js";
import { protect } from "../middlewares/authMiddleware.js";
import { canInsert } from "../middlewares/permissions.js";
import Abonnement from "../models/Abonnement.js";
import multer from "multer";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

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

    const imageUrl = await uploadToCloudinary(req.file.buffer, "galerie");

    const newImage = new Galerie({
      filename: imageUrl,
      titre: req.body.titre || null,
      categorie: req.body.categorie || "Divers",
      atelierId: req.user.atelierId
    });

    await newImage.save();

    res.json({ 
      message: "Image uploadée avec succès ✅", 
      image: newImage 
    });
  } catch (err) {
    console.error("Erreur upload galerie:", err);
    res.status(500).json({ error: "Erreur lors de l'upload de l'image" });
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
