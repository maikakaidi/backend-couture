import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),   // Important pour Cloudinary
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

export default upload;
