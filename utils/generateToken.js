import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET, // clé secrète dans ton .env
    { expiresIn: "30d" }
  );
};

export default generateToken;
