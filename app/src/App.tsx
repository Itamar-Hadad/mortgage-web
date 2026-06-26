import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from './shared/i18n'
import { Questionnaire } from './consumer-flow/questionnaire/Questionnaire'
import { PersonalArea } from './personal-area/PersonalArea'
import { AdminScreen } from './admin/AdminScreen'
import { AdvisorScreen } from './advisor/AdvisorScreen'
import { SignUpPage } from './personal-area/auth/SignUpPage'
import { SignInPage } from './personal-area/auth/SignInPage'
import { StaffSignInPage } from './personal-area/auth/StaffSignInPage'
import { HomePage } from './pages/HomePage'
import { RequireRole } from './shared/RequireRole'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/questionnaire" element={<Questionnaire />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/staff-sign-in" element={<StaffSignInPage />} />
      <Route path="/personal-area" element={<PersonalArea />} />
      <Route path="/advisor" element={<RequireRole role="advisor"><AdvisorScreen /></RequireRole>} />
      <Route path="/admin" element={<RequireRole role="admin"><AdminScreen /></RequireRole>} />
      {/* legacy redirect */}
      <Route path="/home" element={<Navigate to="/" replace />} />
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
