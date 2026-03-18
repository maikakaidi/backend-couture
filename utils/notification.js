// utils/notification.js
export const sendNotification = async (title, message) => {
  try {
    console.log(`[NOTIFICATION] ${title} - ${message}`);
  } catch (err) {
    console.error("Erreur envoi notification:", err.message);
  }
};
