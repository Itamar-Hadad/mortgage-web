import { useTranslation } from 'react-i18next'

export function MessagesPlaceholder() {
  const { t } = useTranslation()
  return <p style={{ color: 'var(--color-on-surface-variant)' }}>{t('advisor.messages_placeholder')}</p>
}
