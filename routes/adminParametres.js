import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import AdminParametres from "../models/AdminParametres.js";

const router = express.Router();

/* =====================================================
   📂 Création auto dossier uploads/promos
===================================================== */

const promoDir = "uploads/promos";

if (!fs.existsSync(promoDir)) {
  fs.mkdirSync(promoDir, { recursive: true });
}

/* =====================================================
   📸 MULTER CONFIG (UPLOAD PROMOS)
===================================================== */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, promoDir);
  },
  filename: (req, file, cb) => {
    const unique =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* =====================================================
   ✅ UPLOAD IMAGE PROMO
===================================================== */

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Aucune image" });

    // chemin enregistré en base
    const imagePath = `uploads/promos/${req.file.filename}`;

    res.json({
      message: "Image uploadée ✅",
      image: imagePath,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur upload" });
  }
});

/* =====================================================
   ✅ SAUVEGARDE PARAMETRES
===================================================== */

router.post("/save", async (req, res) => {
  try {
    const { messageDefilant, imagesDefilantes } = req.body;

    let parametres = await AdminParametres.findOne();

    if (!parametres) {
      parametres = new AdminParametres();
    }

    parametres.messageDefilant = messageDefilant || "";
    parametres.imagesDefilantes = imagesDefilantes || [];

    await parametres.save();

    res.json(parametres);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur sauvegarde paramètres" });
  }
});

/* =====================================================
   ✅ GET PARAMETRES
===================================================== */

router.get("/", async (req, res) => {
  try {
    const parametres = await AdminParametres.findOne();
    res.json(parametres || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur récupération" });
  }
});

export default router;
