// middlewares/dbCheck.js
import mongoose from "mongoose";

export function checkDbConnection(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    // 0 = déconnecté, 1 = connecté, 2 = en cours de connexion, 3 = déconnexion
    return res.status(503).json({
      success: false,
      message: "⏳ Base de données non connectée. Réessayez plus tard."
    });
  }
  next();
}
