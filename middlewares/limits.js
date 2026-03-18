const rateLimit = require('express-rate-limit');
module.exports = (name) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: `Trop de requêtes sur ${name}`
  });
