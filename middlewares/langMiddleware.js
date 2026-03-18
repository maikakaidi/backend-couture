import fs from "fs";
import path from "path";

// Charger les traductions une seule fois
const localesPath = path.resolve("locales");
const translations = {
  fr: JSON.parse(fs.readFileSync(path.join(localesPath, "fr.json"), "utf8")),
  en: JSON.parse(fs.readFileSync(path.join(localesPath, "en.json"), "utf8")),
  ar: JSON.parse(fs.readFileSync(path.join(localesPath, "ar.json"), "utf8")),
};

// Fonction de traduction
export const translate = (key, lang = "fr") => {
  const chosenLang = ["fr", "en", "ar"].includes(lang) ? lang : "fr";
  return translations[chosenLang][key] || key; // fallback sur la clé
};

// Middleware détection langue
export const detectLangMiddleware = (req, res, next) => {
  // 1. Priorité au header Accept-Language (envoyé par frontend)
  // 2. Sinon body.langue (si présent)
  // 3. Sinon défaut "fr"
  let lang = req.headers["accept-language"]?.split(",")[0]?.toLowerCase()?.trim() ||
             req.body?.langue ||
             "fr";

  // Normalisation stricte
  if (lang.startsWith("fr")) lang = "fr";
  else if (lang.startsWith("en")) lang = "en";
  else if (lang.startsWith("ar")) lang = "ar";
  else lang = "fr";

  req.langue = lang;
  next();
};
