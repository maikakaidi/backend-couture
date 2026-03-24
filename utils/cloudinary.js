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

// Fonction d'upload optimisée pour multer (buffer)
export const uploadToCloudinary = async (fileBuffer, folder = "couture-atelier") => {
  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder: folder,
          resource_type: "image",
          quality: "auto:good"
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );

      const stream = require("stream");
      const bufferStream = new stream.PassThrough();
      bufferStream.end(fileBuffer);
      bufferStream.pipe(uploadStream);
    });

    return result;
  } catch (error) {
    console.error("Erreur Cloudinary :", error);
    throw new Error("Échec upload Cloudinary");
  }
};

export default cloudinary;
