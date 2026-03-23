import express from "express";
import Galerie from "../models/Galerie.js";
import { protect } from "../middlewares/authMiddleware.js";
import { canInsert, canModifyOrDelete } from "../middlewares/permissions.js";
import Abonnement from "../models/Abonnement.js";
import multer from "multer";
import { uploadToCloudinary } from "../utils/cloudinary.js"; // ← importe la fonction Cloudinary

const router = express.Router();

// Configuration Multer temporaire (mémoire suffit, pas besoin de disque)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Liste des images (inchangé)
router.get("/", protect, async (req, res) => {
  try {
    const images = await Galerie.find({ atelierId: req.user.atelierId }).sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    console.error("Erreur récupération galerie:", err);
    res.status(500).json({ error: "Erreur récupération galerie" });
  }
});

// Upload image → Cloudinary
router.post("/upload", protect, canInsert, upload.single("imageGalerie"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier reçu" });
    }

    // Vérification limite abonnement
    const abonnement = await Abonnement.findOne({ atelierId: req.user.atelierId });
    const count = await Galerie.countDocuments({ atelierId: req.user.atelierId });

    if (abonnement && count >= abonnement.maxGaleriePhotos) {
      return res.status(403).json({ error: "Limite atteinte pour la galerie" });
    }

    // Upload direct sur Cloudinary
    const imageUrl = await uploadToCloudinary(req.file.buffer, 'galerie');

    const newImage = new Galerie({
      filename: imageUrl,          // ← on stocke l’URL complète
      titre: req.body.titre || null,
      categorie: req.body.categorie || "Divers",
      atelierId: req.user.atelierId
    });

    await newImage.save();

    res.json({
      message: "Image uploadée sur Cloudinary ✅",
      image: newImage
    });
  } catch (err) {
    console.error("Erreur upload galerie:", err);
    res.status(500).json({ error: "Erreur upload image" });
  }
});

// Supprimer (inchangé, mais maintenant les images Cloudinary restent accessibles même si supprimées en base)
router.delete("/:id", protect, canModifyOrDelete, async (req, res) => {
  try {
    await Galerie.findOneAndDelete({ _id: req.params.id, atelierId: req.user.atelierId });
    res.json({ message: "Image supprimée ✅" });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression image" });
  }
});

export default router;
