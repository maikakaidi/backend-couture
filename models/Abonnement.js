import mongoose from "mongoose";

const abonnementSchema = new mongoose.Schema(
  {
    atelierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Atelier",
      required: [true, "Atelier obligatoire ❌"],
      index: true,
    },

    type: {
      type: String,
      enum: ["essai", "3mois", "6mois", "1an"],
      required: [true, "Type d’abonnement obligatoire ❌"],
    },

    actif: {
      type: Boolean,
      default: true,
      index: true,
    },

    dateDebut: {
      type: Date,
      default: Date.now,
    },

    dateFin: {
      type: Date,
      required: [true, "Date de fin obligatoire ❌"],
      index: true,
    },

    moyenPaiement: {
      type: String,
      trim: true,
    },

    utilisateursInclus: { type: Number, default: 1 },
    utilisateursPayants: { type: Number, default: 0 },
    limiteUtilisateurs: { type: Number, default: 10 },

    maxGaleriePhotos: { type: Number, default: 0 },
    maxCommandePhotos: { type: Number, default: 0 },
  },
  { timestamps: true }
);


// =============================
// 🔒 Vérification avant sauvegarde
// =============================
abonnementSchema.pre("save", function (next) {
  try {
    if (this.dateFin <= this.dateDebut) {
      throw new Error(
        "La date de fin doit être après la date de début ❌"
      );
    }

    // 🔄 Définir quotas automatiquement
    switch (this.type) {
      case "essai":
        this.maxGaleriePhotos = 20;
        this.maxCommandePhotos = 20;
        break;

      case "3mois":
        this.maxGaleriePhotos = 200;
        this.maxCommandePhotos = 200;
        break;

      case "6mois":
        this.maxGaleriePhotos = 500;
        this.maxCommandePhotos = 500;
        break;

      case "1an":
        this.maxGaleriePhotos = 1000;
        this.maxCommandePhotos = 1000;
        break;

      default:
        this.maxGaleriePhotos = 50;
        this.maxCommandePhotos = 50;
    }

    // ✅ Désactiver automatiquement si expiré
    if (this.dateFin < new Date()) {
      this.actif = false;
    }

    next();
  } catch (err) {
    console.error("❌ Erreur abonnement:", err.message);
    next(err);
  }
});


// =============================
// ✅ Méthode : abonnement valide
// =============================
abonnementSchema.methods.estValide = function () {
  return this.actif && this.dateFin > new Date();
};


// =============================
// ✅ Middleware auto-expiration
// (quand on fait une requête)
// =============================
abonnementSchema.pre("findOne", function () {
  this.where({
    dateFin: { $gt: new Date() },
    actif: true,
  });
});


export default mongoose.models.Abonnement ||
  mongoose.model("Abonnement", abonnementSchema);
