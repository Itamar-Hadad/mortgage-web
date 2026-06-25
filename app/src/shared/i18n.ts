import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import he from '../locales/he.json'

// ADR-0004: every UI string goes through t('key'); he.json is the only
// dictionary today, but adding en.json/ru.json/fr.json later needs zero
// component changes.
i18n.use(initReactI18next).init({
  resources: {
    he: { translation: he },
  },
  lng: 'he',
  fallbackLng: 'he',
  interpolation: { escapeValue: false },
})

export default i18n