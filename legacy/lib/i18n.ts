import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "dashboard": "Dashboard",
      "members": "Members",
      "billing": "Billing",
      "workouts": "Workouts",
      "diet": "Diet",
      "settings": "Settings",
      "welcome": "Welcome back",
      "save": "Save",
      "cancel": "Cancel",
      "edit": "Edit",
      "delete": "Delete",
      // ... Add more keys as needed, slowly transitioning code
    }
  },
  hi: {
    translation: {
      "dashboard": "Dashboard",
      "members": "Members",
      "billing": "Billing",
      "workouts": "Workouts",
      "diet": "Diet",
      "settings": "Settings",
      "welcome": "Welcome back",
      "save": "Save",
      "cancel": "Cancel",
      "edit": "Edit",
      "delete": "Delete",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
