import express from "express";
import { registerUser, loginUser, getProfile } from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Inscription (publique)
router.post("/register", registerUser);

// Connexion (publique)
router.post("/login", loginUser);

// Profil (protégé par token)
router.get("/profile", protect, getProfile);

export default router;
