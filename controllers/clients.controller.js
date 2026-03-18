import Client from "../models/Client.js";

// Récupérer tous les clients
export const getClients = async (req, res) => {
  try {
    const clients = await Client.find();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération clients" });
  }
};

// Ajouter un client
export const addClient = async (req, res) => {
  try {
    const { name, email, phone, type } = req.body;
    const client = new Client({ name, email, phone, type });
    await client.save();
    res.status(201).json(client);
  } catch (err) {
    res.status(400).json({ error: "Erreur ajout client", details: err.message });
  }
};
