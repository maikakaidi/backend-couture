const db = require("../config/db");
const bcrypt = require("bcryptjs");

const email = "admin@couture.com";
const password = "admin123";

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  const sql = `
    INSERT INTO admins (email, password)
    VALUES (?, ?)
  `;

  db.query(sql, [email, hash], (err, result) => {
    if (err) {
      console.error("Erreur SQL :", err);
      process.exit(1);
    }

    console.log("✅ Admin créé avec succès !");
    process.exit(0);
  });
});
