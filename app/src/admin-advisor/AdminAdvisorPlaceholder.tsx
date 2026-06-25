import { useTranslation } from 'react-i18next'

export function AdminAdvisorPlaceholder() {
  const { t } = useTranslation()
  return <p>{t('placeholder.admin_advisor')}</p>
}