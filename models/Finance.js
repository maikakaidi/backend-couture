import mongoose from "mongoose";

const financeSchema = new mongoose.Schema(
  {
    type: { 
      type: String, 
      enum: ["vente", "dépense", "commande"], 
      required: [true, "Type d’opération obligatoire ❌"] 
    },
    montant: { 
      type: Number, 
      required: [true, "Montant obligatoire ❌"], 
      min: [0, "Le montant doit être positif ❌"] 
    },
    description: { type: String, trim: true },
    refId: { type: mongoose.Schema.Types.ObjectId }, // lien vers commande, vente ou dépense
    atelierId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Atelier", 
      required: [true, "Atelier obligatoire ❌"], 
      index: true 
    }
  }, 
  { timestamps: true }
);

// 🔒 Hook avant sauvegarde → cohérence avec refId
financeSchema.pre("save", function (next) {
  try {
    if (!this.refId) {
      console.warn("⚠️ Finance sans référence liée (commande/vente/dépense)");
    }
    next();
  } catch (err) {
    console.error("❌ Erreur finance:", err.message);
    next(err);
  }
});

export default mongoose.models.Finance || mongoose.model("Finance", financeSchema);
