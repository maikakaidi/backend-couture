import mongoose from "mongoose";

const commandeSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client obligatoire ❌"],
    },

    atelierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Atelier",
      required: [true, "Atelier obligatoire ❌"],
      index: true,
    },

    description: { 
      type: String, 
      required: [true, "Description obligatoire ❌"], 
      trim: true 
    },

    montant: { 
      type: Number, 
      required: [true, "Montant obligatoire ❌"], 
      min: [0, "Le montant doit être positif ❌"] 
    },

    acompte: { 
      type: Number, 
      default: 0, 
      min: [0, "L’acompte doit être positif ❌"] 
    },

    image: { type: String, default: null },

    rdv: { 
      type: Date, 
      required: [true, "Date de rendez-vous obligatoire ❌"] 
    }
  }, 
  { timestamps: true }
);

// 🔒 Vérifier cohérence de la date de rendez-vous
commandeSchema.pre("save", function (next) {
  try {
    if (this.rdv && this.rdv < new Date()) {
      throw new Error("La date de rendez-vous doit être dans le futur ❌");
    }
    next();
  } catch (err) {
    console.error("❌ Erreur commande:", err.message);
    next(err);
  }
});

export default mongoose.models.Commande || mongoose.model("Commande", commandeSchema);
