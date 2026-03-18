import mongoose from "mongoose";

const adminParametresSchema = new mongoose.Schema(
  {
    messageDefilant: { 
      type: String, 
      default: "", 
      trim: true 
    },
    imagesDefilantes: [
      { type: String, trim: true }
    ]
  }, 
  { timestamps: true }
);

export default mongoose.models.AdminParametres || mongoose.model("AdminParametres", adminParametresSchema);
