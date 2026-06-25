import { useTranslation } from 'react-i18next'

export function ConsumerFlowPlaceholder() {
  const { t } = useTranslation()
  return <p>{t('placeholder.consumer_flow')}</p>
}