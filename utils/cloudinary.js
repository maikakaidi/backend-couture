// utils/cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // très important pour HTTPS
});

// Fonction helper pour uploader une image
const uploadImage = async (filePath, folder = 'couture-atelier', publicId = null) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder || 'couture-atelier',
      public_id: publicId || `img-${Date.now()}`,
      resource_type: 'image',
      overwrite: true,
    });

    // Supprime le fichier temporaire local
    require('fs').unlinkSync(filePath);

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error('Erreur upload Cloudinary:', error);
    throw error;
  }
};

module.exports = { cloudinary, uploadImage };
