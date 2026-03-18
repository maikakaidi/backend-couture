import mongoose from "mongoose";

const venteSchema = new mongoose.Schema(
  {
    articleId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Article", 
      required: [true, "Article obligatoire ❌"], 
      index: true 
    },
    quantite: { 
      type: Number, 
      required: [true, "Quantité obligatoire ❌"], 
      min: [1, "La quantité doit être au moins 1 ❌"] 
    },
    prixTotal: { 
      type: Number, 
      required: [true, "Prix total obligatoire ❌"], 
      min: [0, "Le prix total doit être positif ❌"] 
    },
    clientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Client", 
      required: false 
    },
    atelierId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Atelier", 
      required: [true, "Atelier obligatoire ❌"], 
      index: true 
    },
    dateVente: { type: Date, default: Date.now }
  }, 
  { timestamps: true }
);

// 🔒 Hook avant sauvegarde → mettre à jour le stock de l’article
venteSchema.pre("save", async function (next) {
  try {
    const Article = mongoose.model("Article");
    const article = await Article.findById(this.articleId);

    if (!article) {
      throw new Error("Article introuvable ❌");
    }

    if (article.stock < this.quantite) {
      throw new Error("Stock insuffisant pour cette vente ❌");
    }

    // Décrémenter le stock et incrémenter le nombre vendu
    article.stock -= this.quantite;
    article.vendu += this.quantite;
    await article.save();

    next();
  } catch (err) {
    console.error("❌ Erreur vente:", err.message);
    next(err);
  }
});

const Vente = mongoose.models.Vente || mongoose.model("Vente", venteSchema);

export default Vente;
