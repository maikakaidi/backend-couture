if (user.status === 'bloqué') {
  return res.status(403).json({
    message: 'Compte bloqué. Contactez l’administrateur.'
  });
}
