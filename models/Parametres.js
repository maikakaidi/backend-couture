import mongoose from "mongoose";

const parametresSchema = new mongoose.Schema({
  atelierId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Atelier", 
    required: true, 
    index: true 
  }, // ✅ rattachement obligatoire

  atelierNom: { type: String, required: true }, // ✅ nom de l’atelier

  logo: { type: String }, // ✅ chemin du fichier uploadé

  themeCouleur: { type: String, default: "#0D47A1" }, // ✅ couleur par défaut

  whatsappMsg: { type: String } // ✅ message WhatsApp personnalisé
}, { timestamps: true });

export default mongoose.models.Parametres || mongoose.model("Parametres", parametresSchema);
