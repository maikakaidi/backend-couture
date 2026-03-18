import mongoose from "mongoose";

const articleSchema = new mongoose.Schema(
  {
    nom: { 
      type: String, 
      required: [true, "Le nom de l’article est obligatoire ❌"], 
      trim: true 
    },
    prix: { 
      type: Number, 
      required: [true, "Le prix est obligatoire ❌"], 
      min: [0, "Le prix doit être positif ❌"] 
    },
    categorie: { 
      type: String, 
      required: [true, "La catégorie est obligatoire ❌"], 
      trim: true 
    },
    stock: { 
      type: Number, 
      required: true, 
      min: [0, "Le stock doit être positif ❌"], 
      default: 0 
    },
    vendu: { 
      type: Number, 
      required: true, 
      min: [0, "Le nombre vendu doit être positif ❌"], 
      default: 0 
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

const Article = mongoose.models.Article || mongoose.model("Article", articleSchema);

export default Article;
