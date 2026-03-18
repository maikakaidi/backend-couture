import Measurement from "../models/Measurement.js";

/* =========================
   CREATE MEASUREMENT (ADMIN)
========================= */
export const createMeasurement = async (req, res) => {
  try {
    const { clientId, type, value } = req.body;

    if (!clientId || !type || !value) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const measurement = new Measurement({ clientId, type, value });
    await measurement.save();

    res.status(201).json({ message: "Mesure créée", measurement });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/* =========================
   GET ALL MEASUREMENTS (ADMIN)
========================= */
export const getAllMeasurements = async (req, res) => {
  try {
    const measurements = await Measurement.find().sort({ createdAt: -1 });
    res.status(200).json(measurements);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/* =========================
   GET MEASUREMENT BY ID (ADMIN)
========================= */
export const getMeasurementById = async (req, res) => {
  try {
    const measurement = await Measurement.findById(req.params.id);

    if (!measurement) {
      return res.status(404).json({ message: "Mesure introuvable" });
    }

    res.status(200).json(measurement);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/* =========================
   UPDATE MEASUREMENT (ADMIN)
========================= */
export const updateMeasurement = async (req, res) => {
  try {
    const measurement = await Measurement.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!measurement) {
      return res.status(404).json({ message: "Mesure introuvable" });
    }

    res.status(200).json({ message: "Mesure mise à jour", measurement });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/* =========================
   DELETE MEASUREMENT (ADMIN)
========================= */
export const deleteMeasurement = async (req, res) => {
  try {
    const measurement = await Measurement.findByIdAndDelete(req.params.id);

    if (!measurement) {
      return res.status(404).json({ message: "Mesure introuvable" });
    }

    res.status(200).json({ message: "Mesure supprimée" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
