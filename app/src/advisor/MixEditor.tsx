import { useTranslation } from 'react-i18next'
import { calcMix, mixRisk } from '../calc-engine'
import { defaultCalcParams } from './calcDefaults'
import type { MixRoute } from '../consumer-flow/questionnaire/types'
import type { Params } from '../calc-engine'

interface MixEditorProps {
  routes: MixRoute[]
  onChange: (routes: MixRoute[]) => void
  params?: Params
}

export function MixEditor({ routes, onChange, params = defaultCalcParams() }: MixEditorProps) {
  const { t } = useTranslation()
  const mixCalc = calcMix(routes, params)
  const risk = mixRisk(routes)

  function patchRoute(index: number, patch: Partial<MixRoute>) {
    onChange(routes.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  return (
    <div className="space-y-4">
      {routes.map((route, i) => (
        <div
          key={i}
          className="rounded-xl p-5 space-y-4"
          style={{ background: 'var(--color-surface-container-low)', border: '1px solid rgba(188,201,204,0.35)' }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ss-label">{t('advisor.mix_editor.route_amount')}</label>
              <input
                type="number"
                className="ss-input"
                aria-label={t('advisor.mix_editor.route_amount')}
                value={route.amount}
                onChange={(e) => patchRoute(i, { amount: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="ss-label">{t('advisor.mix_editor.route_years')}</label>
              <input
                type="number"
                className="ss-input"
                aria-label={t('advisor.mix_editor.route_years')}
                value={route.years}
                onChange={(e) => patchRoute(i, { years: Number(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ss-label">{t('advisor.mix_editor.route_anchor')}</label>
              <input
                type="number"
                step="0.01"
                className="ss-input"
                aria-label={t('advisor.mix_editor.route_anchor')}
                value={route.anchor * 100}
                onChange={(e) => patchRoute(i, { anchor: (Number(e.target.value) || 0) / 100 })}
              />
            </div>
            <div>
              <label className="ss-label">{t('advisor.mix_editor.route_margin')}</label>
              <input
                type="number"
                step="0.01"
                className="ss-input"
                aria-label={t('advisor.mix_editor.route_margin')}
                value={route.margin * 100}
                onChange={(e) => patchRoute(i, { margin: (Number(e.target.value) || 0) / 100 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ss-label">{t('advisor.mix_editor.route_board')}</label>
              <select
                className="ss-input"
                aria-label={t('advisor.mix_editor.route_board')}
                value={route.board}
                onChange={(e) => patchRoute(i, { board: e.target.value as MixRoute['board'] })}
              >
                <option value="שפיצר">{t('advisor.mix_editor.board_options.שפיצר')}</option>
                <option value="קרן שווה">{t('advisor.mix_editor.board_options.קרן שווה')}</option>
              </select>
            </div>
            <div>
              <label className="ss-label">{t('advisor.mix_editor.route_index')}</label>
              <select
                className="ss-input"
                aria-label={t('advisor.mix_editor.route_index')}
                value={route.indexType}
                onChange={(e) => patchRoute(i, { indexType: e.target.value as MixRoute['indexType'] })}
              >
                <option value="ללא">{t('advisor.mix_editor.index_options.ללא')}</option>
                <option value="מדד">{t('advisor.mix_editor.index_options.מדד')}</option>
                <option value="דולר">{t('advisor.mix_editor.index_options.דולר')}</option>
                <option value="אירו">{t('advisor.mix_editor.index_options.אירו')}</option>
              </select>
            </div>
          </div>
        </div>
      ))}

      <div className="glass-panel rounded-xl p-5 grid grid-cols-2 gap-4">
        <div>
          <span className="ss-label">{t('advisor.mix_editor.first_payment')}</span>
          <p data-testid="first-payment" className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
            {Math.round(mixCalc.firstPay).toLocaleString()}
          </p>
        </div>
        <div>
          <span className="ss-label">{t('advisor.mix_editor.total_payment')}</span>
          <p className="text-xl font-bold" style={{ color: 'var(--color-on-surface)' }}>
            {Math.round(mixCalc.total).toLocaleString()}
          </p>
        </div>
        <div>
          <span className="ss-label">{t('advisor.mix_editor.total_interest')}</span>
          <p className="text-xl font-bold" style={{ color: 'var(--color-on-surface)' }}>
            {Math.round(mixCalc.interest + mixCalc.indexation).toLocaleString()}
          </p>
        </div>
        <div>
          <span className="ss-label">{t('advisor.mix_editor.risk_label')}</span>
          <p data-testid="risk-label" className="text-xl font-bold" style={{ color: 'var(--color-secondary)' }}>
            {risk.label}
          </p>
        </div>
      </div>
    </div>
  )
}