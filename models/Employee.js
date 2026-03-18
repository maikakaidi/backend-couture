// models/Employee.js
import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    nom: { 
      type: String, 
      required: [true, "Le nom de l’employé est obligatoire ❌"], 
      trim: true 
    },

    poste: { 
      type: String, 
      required: [true, "Le poste est obligatoire ❌"], 
      trim: true 
    },

    salaire: { 
      type: Number, 
      required: [true, "Le salaire est obligatoire ❌"], 
      min: [0, "Le salaire doit être positif ❌"] 
    }, // salaire brut

    advances: [
      {
        amount: { 
          type: Number, 
          required: [true, "Le montant de l’avance est obligatoire ❌"], 
          min: [0, "L’avance doit être positive ❌"] 
        },
        date: { type: Date, default: Date.now }
      }
    ],

    atelierId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Atelier", 
      required: [true, "Atelier obligatoire ❌"], 
      index: true 
    }
  }, 
  { timestamps: true }
);

// ✅ Méthode pour calculer le salaire net (salaire brut - total des avances)
employeeSchema.methods.salaireNet = function () {
  try {
    const totalAvances = Array.isArray(this.advances) 
      ? this.advances.reduce((sum, a) => sum + (a.amount || 0), 0) 
      : 0;
    return this.salaire - totalAvances;
  } catch (err) {
    console.error("❌ Erreur calcul salaire net:", err.message);
    return this.salaire;
  }
};

export default mongoose.models.Employee || mongoose.model("Employee", employeeSchema);
