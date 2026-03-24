// utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Fonction adaptée pour multer (buffer en mémoire)
export const uploadToCloudinary = async (fileBuffer, folder = "couture-atelier") => {
  try {
    const result = await cloudinary.uploader.upload_stream(
      { 
        folder: folder,
        resource_type: "image",
        quality: "auto",
      },
      (error, result) => {
        if (error) throw error;
      }
    );

    // Convertir buffer en stream
    const stream = require("stream");
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);
    bufferStream.pipe(result);

    return new Promise((resolve, reject) => {
      result.on("finish", () => resolve(result.secure_url));
      result.on("error", reject);
    });
  } catch (error) {
    console.error("Erreur Cloudinary :", error);
    throw error;
  }
};

export default cloudinary;
