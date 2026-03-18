import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom est obligatoire ❌"],
      trim: true,
    },

    telephone: {
      type: String,
      required: [true, "Le numéro de téléphone est obligatoire ❌"],
      unique: true,
      trim: true,
    },

    motDePasse: {
      type: String,
      required: [true, "Le mot de passe est obligatoire ❌"],
      minlength: [6, "Le mot de passe doit contenir au moins 6 caractères ❌"],
      select: false, // ✅ ne pas renvoyer par défaut
    },

    // 🔥 Rôles
    role: {
      type: String,
      enum: ["superadmin", "adminatelier", "soususer", "disabled"],
      default: "adminatelier",
    },

    // 🔥 Statut de validation
    statut: {
      type: String,
      enum: ["en_attente", "valide", "essai"],
      default: "en_attente",
    },

    // Chaque user appartient à un atelier
    atelierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Atelier",
      required: true,
    },

    abonnement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Abonnement",
    },

    dateInscription: {
      type: Date,
      default: Date.now,
    },

    // 🌍 Langue préférée de l’utilisateur
    langue: {
      type: String,
      enum: ["fr", "en", "ar"],
      default: "fr",
    },
  },
  { timestamps: true }
);

// 🔒 Hash automatique du mot de passe
UserSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("motDePasse")) return next();

    const salt = await bcrypt.genSalt(10);
    this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
    next();
  } catch (err) {
    console.error("❌ Erreur hash mot de passe:", err.message);
    next(err);
  }
});

// 🔑 Comparer mot de passe
UserSchema.methods.comparePassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.motDePasse);
  } catch (err) {
    console.error("❌ Erreur comparaison mot de passe:", err.message);
    return false;
  }
};

export default mongoose.models.User || mongoose.model("User", UserSchema);
