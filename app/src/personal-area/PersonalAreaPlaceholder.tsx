import { useTranslation } from 'react-i18next'

export function PersonalAreaPlaceholder() {
  const { t } = useTranslation()
  return <p>{t('placeholder.personal_area')}</p>
}