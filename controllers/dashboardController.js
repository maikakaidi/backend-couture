// controllers/dashboardController.js
import Client from "../models/Client.js";
import Order from "../models/Order.js";
import Inventory from "../models/Inventory.js";

// Nombre total de clients
export const getClientsCount = async (req, res) => {
  try {
    const count = await Client.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération clients" });
  }
};

// Nombre total de commandes
export const getOrdersCount = async (req, res) => {
  try {
    const count = await Order.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération commandes" });
  }
};

// Nombre d’articles en stock
export const getInventoryCount = async (req, res) => {
  try {
    const count = await Inventory.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération inventaire" });
  }
};

// Revenus par trimestre
export const getQuarterRevenues = async (req, res) => {
  try {
    const orders = await Order.find();
    const trimestres = [0, 0, 0, 0];

    orders.forEach((order) => {
      const month = new Date(order.date).getMonth(); // 0-11
      const quarter = Math.floor(month / 3); // 0-3
      trimestres[quarter] += order.amount;
    });

    res.json({
      total: trimestres.reduce((a, b) => a + b, 0),
      trimestres: [
        { quarter: "T1", revenue: trimestres[0] },
        { quarter: "T2", revenue: trimestres[1] },
        { quarter: "T3", revenue: trimestres[2] },
        { quarter: "T4", revenue: trimestres[3] },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération revenus" });
  }
};

// Stats mensuelles
export const getMonthlyStats = async (req, res) => {
  try {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const stats = [];

    for (let i = 0; i < 12; i++) {
      const clients = await Client.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), i, 1),
          $lt: new Date(new Date().getFullYear(), i + 1, 1),
        },
      });

      const orders = await Order.countDocuments({
        date: {
          $gte: new Date(new Date().getFullYear(), i, 1),
          $lt: new Date(new Date().getFullYear(), i + 1, 1),
        },
      });

      stats.push({ month: months[i], clients, orders });
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération stats mensuelles" });
  }
};

// Répartition des clients
export const getClientsDistribution = async (req, res) => {
  try {
    const premium = await Client.countDocuments({ type: "premium" });
    const standard = await Client.countDocuments({ type: "standard" });
    const basic = await Client.countDocuments({ type: "basic" });

    res.json([
      { name: "Clients Premium", value: premium },
      { name: "Clients Standard", value: standard },
      { name: "Clients Basique", value: basic },
    ]);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération distribution clients" });
  }
};
