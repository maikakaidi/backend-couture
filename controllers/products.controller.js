import Product from "../models/Product.js";

/* ======================
   CREATE (ADMIN)
====================== */
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image requise" });
    }

    const product = new Product({
      name,
      description,
      price,
      stock,
      image: `/uploads/${req.file.filename}`
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur création produit" });
  }
};

/* ======================
   GET ALL (PUBLIC)
====================== */
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Erreur récupération produits" });
  }
};

/* ======================
   GET ONE (PUBLIC)
====================== */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Produit introuvable" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/* ======================
   UPDATE (ADMIN)
====================== */
export const updateProduct = async (req, res) => {
  try {
    const updatedData = { ...req.body };

    if (req.file) {
      updatedData.image = `/uploads/${req.file.filename}`;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Erreur mise à jour produit" });
  }
};

/* ======================
   DELETE (ADMIN)
====================== */
export const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Produit supprimé" });
  } catch (error) {
    res.status(500).json({ message: "Erreur suppression produit" });
  }
};
