import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from './shared/i18n'
import { Questionnaire } from './consumer-flow/questionnaire/Questionnaire'
import { PersonalAreaPlaceholder } from './personal-area/PersonalAreaPlaceholder'
import { AdminScreen } from './admin/AdminScreen'
import { AdvisorScreen } from './advisor/AdvisorScreen'
import { SignUpPage } from './personal-area/auth/SignUpPage'
import { SignInPage } from './personal-area/auth/SignInPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Questionnaire />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/personal-area" element={<PersonalAreaPlaceholder />} />
      <Route path="/advisor" element={<AdvisorScreen />} />
      <Route path="/admin" element={<AdminScreen />} />
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
