// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error("❌ Erreur:", err.stack);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Erreur serveur",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
};

export default errorHandler;
