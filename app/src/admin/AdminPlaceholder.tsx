import { useTranslation } from 'react-i18next'

export function AdminPlaceholder() {
  const { t } = useTranslation()
  return <p>{t('placeholder.admin')}</p>
}