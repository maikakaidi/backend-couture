import Payment from "../models/Payment.js";

// Créer un paiement
export const createPayment = async (req, res) => {
  try {
    const payment = await Payment.create({
      user: req.user._id,
      orderId: req.body.orderId,
      status: "pending"
    });
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// Confirmer un paiement
export const confirmPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Paiement introuvable" });

    payment.status = "confirmed";
    await payment.save();
    res.json({ message: "Paiement confirmé", payment });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// Voir tous les paiements
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate("user", "name email");
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
