router.post('/callback', (req, res) => {
  const { transaction_id, status } = req.body;

  if (status === 'SUCCESS') {
    db.query(
      `UPDATE subscription_payments 
       SET status='réussi'
       WHERE transaction_id=?`,
      [transaction_id]
    );

    // Activer Premium
    db.query(
      `UPDATE subscriptions 
       SET plan='premium',
           status='actif',
           start_date=CURDATE(),
           end_date=DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       WHERE user_id=(
         SELECT user_id FROM subscription_payments
         WHERE transaction_id=?
       )`,
      [transaction_id]
    );
  }

  res.json({ success: true });
});
