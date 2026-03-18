import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: [true, "Email obligatoire ❌"], 
      unique: true, 
      trim: true, 
      lowercase: true 
    },
    password: { 
      type: String, 
      required: [true, "Mot de passe obligatoire ❌"], 
      minlength: [6, "Le mot de passe doit contenir au moins 6 caractères ❌"] 
    },
    isAdmin: { 
      type: Boolean, 
      default: true 
    }
  }, 
  { timestamps: true }
);

// 🔒 Hash automatique du mot de passe admin
adminSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    console.error("❌ Erreur hash mot de passe admin:", err.message);
    next(err);
  }
});

// 🔑 Comparer mot de passe
adminSchema.methods.comparePassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (err) {
    console.error("❌ Erreur comparaison mot de passe admin:", err.message);
    return false;
  }
};

export default mongoose.models.Admin || mongoose.model("Admin", adminSchema);
