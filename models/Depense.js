import mongoose from "mongoose";

const depenseSchema = new mongoose.Schema(
  {
    titre: { 
      type: String, 
      required: [true, "Le titre de la dépense est obligatoire ❌"], 
      trim: true 
    },
    montant: { 
      type: Number, 
      required: [true, "Le montant est obligatoire ❌"], 
      min: [0, "Le montant doit être positif ❌"] 
    },
    categorie: { type: String, trim: true, default: "" },
    dateDepense: { type: Date, default: Date.now },
    atelierId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Atelier", 
      required: [true, "Atelier obligatoire ❌"], 
      index: true 
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  }, 
  { timestamps: true }
);

export default mongoose.models.Depense || mongoose.model("Depense", depenseSchema);
