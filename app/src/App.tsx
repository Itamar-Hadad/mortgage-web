import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { I18nextProvider, useTranslation } from 'react-i18next'
import i18n from './shared/i18n'
import { ConsumerFlowPlaceholder } from './consumer-flow/ConsumerFlowPlaceholder'
import { PersonalAreaPlaceholder } from './personal-area/PersonalAreaPlaceholder'
import { AdminAdvisorPlaceholder } from './admin-advisor/AdminAdvisorPlaceholder'

function NavBar() {
  const { t } = useTranslation()
  return (
    <nav>
      <Link to="/">{t('nav.consumer_flow')}</Link>
      <Link to="/personal-area">{t('nav.personal_area')}</Link>
      <Link to="/admin-advisor">{t('nav.admin_advisor')}</Link>
    </nav>
  )
}

export function AppRoutes() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<ConsumerFlowPlaceholder />} />
        <Route path="/personal-area" element={<PersonalAreaPlaceholder />} />
        <Route path="/admin-advisor" element={<AdminAdvisorPlaceholder />} />
      </Routes>
    </>
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