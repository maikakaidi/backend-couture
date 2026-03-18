import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.resolve("uploads");
const folders = ["logos", "promos", "commandes", "galerie"];

// Création auto
folders.forEach(f => {
  const dir = path.join(uploadDir, f);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Stockage Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "galerie";
    if (file.fieldname === "logo") folder = "logos";
    if (file.fieldname === "imagePromo") folder = "promos";
    if (file.fieldname === "commandeImage") folder = "commandes";
    if (file.fieldname === "imageGalerie") folder = "galerie";

    cb(null, path.join(uploadDir, folder));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

export default upload;
