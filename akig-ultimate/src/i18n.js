import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  fr: {
    translation: {
      accueil: "Accueil",
      locataires: "Locataires",
      contrats: "Contrats",
      proprietaires: "Propriétaires",
      rapports: "Rapports",
      parametres: "Paramètres",
    },
  },
  en: {
    translation: {
      accueil: "Home",
      locataires: "Tenants",
      contrats: "Contracts",
      proprietaires: "Owners",
      rapports: "Reports",
      parametres: "Settings",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "fr",
  fallbackLng: "fr",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
