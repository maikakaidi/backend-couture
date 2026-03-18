POST /api/payments/init

router.post('/init', auth, (req, res) => {
  const { plan, provider, phone } = req.body;

  const amount = plan === 'mensuel' ? 20000 : 30000;

  db.query(
    `INSERT INTO subscription_payments 
     (user_id, plan, amount, provider, phone)
     VALUES (?,?,?,?,?)`,
    [req.user.id, plan, amount, provider, phone],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Erreur paiement' });

      // ICI : appel API Mobile Money réel ou simulé
      res.json({
        message: 'Paiement initié. Confirmez sur votre téléphone.'
      });
    }
  );
});
