import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from './shared/i18n'
import { Questionnaire } from './consumer-flow/questionnaire/Questionnaire'
import { PersonalAreaPlaceholder } from './personal-area/PersonalAreaPlaceholder'
import { AdminAdvisorPlaceholder } from './admin-advisor/AdminAdvisorPlaceholder'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Questionnaire />} />
      <Route path="/personal-area" element={<PersonalAreaPlaceholder />} />
      <Route path="/admin-advisor" element={<AdminAdvisorPlaceholder />} />
    </Routes>
  )
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </I18nextProvider>
  )
}
