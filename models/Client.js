import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    nom: { 
      type: String, 
      required: [true, "Le nom du client est obligatoire ❌"], 
      trim: true 
    },

    telephone: { 
      type: String, 
      required: [true, "Le numéro de téléphone est obligatoire ❌"], 
      unique: true, 
      trim: true 
    },

    adresse: { type: String, trim: true },

    // ✅ rattachement obligatoire à l’atelier
    atelierId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Atelier", 
      required: [true, "Atelier obligatoire ❌"], 
      index: true 
    }
  }, 
  { timestamps: true }
);

// 🔒 Hook avant suppression → empêcher suppression si lié à un atelier
clientSchema.pre("remove", async function (next) {
  try {
    if (!this.atelierId) {
      throw new Error("Impossible de supprimer un client sans atelier ❌");
    }
    next();
  } catch (err) {
    console.error("❌ Erreur suppression client:", err.message);
    next(err);
  }
});

export default mongoose.models.Client || mongoose.model("Client", clientSchema);
