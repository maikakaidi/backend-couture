const adminOnly = (req, res, next) => {
  if (req.user && req.user.isAdmin === true) {
    next();
  } else {
    res.status(403).json({ message: "Accès refusé (Admin uniquement)" });
  }
};

export default adminOnly;
