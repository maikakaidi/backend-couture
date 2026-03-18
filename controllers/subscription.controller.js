import Subscription from "../models/Subscription.js";

// Créer un abonnement
export const createSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.create({
      user: req.user._id,
      plan: req.body.plan,
      active: true
    });
    res.status(201).json(subscription);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// Voir mon abonnement
export const getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id });
    res.json(subscription);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// Voir tous les abonnements (admin)
export const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find().populate("user", "name email");
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// Désactiver un abonnement
export const deactivateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) return res.status(404).json({ message: "Abonnement introuvable" });

    subscription.active = false;
    await subscription.save();
    res.json({ message: "Abonnement désactivé", subscription });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
