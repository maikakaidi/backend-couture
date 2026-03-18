import mongoose from "mongoose";

const GalerieSchema = new mongoose.Schema(
  {
    filename: { 
      type: String, 
      required: [true, "Le nom du fichier est obligatoire ❌"], 
      trim: true 
    }, // nom du fichier image

    titre: { type: String, trim: true, default: null }, // titre facultatif

    categorie: { 
      type: String, 
      enum: ["Mariage", "Mode", "Divers"], 
      default: "Divers", 
      trim: true 
    }, // catégorie

    dateUpload: { type: Date, default: Date.now }, // date d’upload

    atelierId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Atelier", 
      required: [true, "Atelier obligatoire ❌"], 
      index: true 
    }
  }, 
  { timestamps: true }
);

// 🔒 Hook avant sauvegarde → vérifier quota galerie
GalerieSchema.pre("save", async function (next) {
  try {
    const Atelier = mongoose.model("Atelier");
    const Abonnement = mongoose.model("Abonnement");

    const atelier = await Atelier.findById(this.atelierId).populate("abonnement");
    if (!atelier || !atelier.abonnement) {
      throw new Error("Atelier ou abonnement introuvable ❌");
    }

    const abonnement = await Abonnement.findById(atelier.abonnement);
    if (!abonnement) {
      throw new Error("Abonnement introuvable ❌");
    }

    const Galerie = mongoose.model("Galerie");
    const countPhotos = await Galerie.countDocuments({ atelierId: this.atelierId });

    if (countPhotos >= abonnement.maxGaleriePhotos) {
      throw new Error("Quota de photos galerie atteint ❌");
    }

    next();
  } catch (err) {
    console.error("❌ Erreur galerie:", err.message);
    next(err);
  }
});

export default mongoose.models.Galerie || mongoose.model("Galerie", GalerieSchema);
