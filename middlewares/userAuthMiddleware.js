import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protectUser = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Utilisateur introuvable" });
      }

      next();
    } catch (error) {
      res.status(401).json({ message: "Token invalide" });
    }
  } else {
    res.status(401).json({ message: "Pas de token" });
  }
};

export default protectUser;
