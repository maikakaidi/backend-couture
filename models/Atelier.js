import mongoose from "mongoose";

const atelierSchema = new mongoose.Schema(
  {
    nom: { 
      type: String, 
      required: [true, "Le nom de l’atelier est obligatoire ❌"], 
      trim: true 
    }, 

    description: { type: String, trim: true },

    telephone: { type: String, trim: true },

    adresse: { type: String, trim: true },

    // ✅ Admin principal de l’atelier
    adminId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: false 
    },

    // ✅ Liste des utilisateurs liés à l’atelier
    utilisateurs: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // ✅ Abonnement lié à l’atelier
    abonnement: { type: mongoose.Schema.Types.ObjectId, ref: "Abonnement" }
  }, 
  { timestamps: true }
);

// 🔒 Hook avant suppression → empêcher suppression si utilisateurs liés
atelierSchema.pre("remove", async function (next) {
  try {
    if (this.utilisateurs && this.utilisateurs.length > 0) {
      throw new Error("Impossible de supprimer un atelier avec des utilisateurs liés ❌");
    }
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.models.Atelier || mongoose.model("Atelier", atelierSchema);
