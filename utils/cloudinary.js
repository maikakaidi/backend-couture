import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configuration Cloudinary avec les 3 variables séparées
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Export direct de l'objet cloudinary
export default cloudinary;

// ✅ Optionnel : fonction utilitaire pour upload
export const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "couture", // tu peux changer le nom du dossier
    });
    return result.secure_url;
  } catch (error) {
    console.error("Erreur Cloudinary :", error);
    throw error;
  }
};
