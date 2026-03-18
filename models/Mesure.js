import mongoose from "mongoose";

const mesureSchema = new mongoose.Schema(
  {
    type: { 
      type: String, 
      required: [true, "Le type de mesure est obligatoire ❌"], 
      trim: true 
    },
    valeur: { 
      type: String, 
      required: [true, "La valeur de la mesure est obligatoire ❌"], 
      trim: true 
    },
    clientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Client", 
      required: [true, "Client obligatoire ❌"], 
      index: true 
    },
    atelierId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Atelier", 
      required: [true, "Atelier obligatoire ❌"], 
      index: true 
    }
  }, 
  { timestamps: true }
);

export default mongoose.models.Mesure || mongoose.model("Mesure", mesureSchema);
