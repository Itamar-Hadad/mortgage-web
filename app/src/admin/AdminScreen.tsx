import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageShell } from '../shared/AppLayout'
import { countRequestsByType } from './dashboard'
import { clientsForAdvisor } from '../advisor/clientList'
import { seedRequests } from '../advisor/seedRequests'
import { ClientProfile } from '../advisor/ClientProfile'
import { DocumentsTab } from '../advisor/DocumentsTab'
import type { MortgageRequest, AdvisorTask } from '../advisor/types'
import type { RiskRule } from '../calc-engine/risk'
import {
  defaultGeneralRates, defaultClockTemplates, defaultIndicesConfig, defaultRiskRules,
  RATE_KEYS, RATE_KEY_LABELS,
  type GeneralRates, type ClockTemplates, type IndicesConfig,
} from './configDefaults'

// ── Seed / stubs ──────────────────────────────────────────────────────────────
// Same pattern as AdvisorScreen — swapped for Firestore query when admin Auth
// claim lands (ARCHITECTURE.md §13, extension-point row "מסך יועץ (#8)").

const ALL_ADVISORS = [
  { uid: 'advisor-demo', name: 'יועץ א — דוד לוי' },
  { uid: 'advisor-other', name: 'יועץ ב — מיכל אברהם' },
]

type AdminView = 'dashboard' | 'clients' | 'config'
type ConfigTab = 'generalRates' | 'riskRules' | 'clockTemplates' | 'monthlyIndices'

// ── helpers ───────────────────────────────────────────────────────────────────

function pct(n: number, total: number) {
  if (total === 0) return 0
  return Math.round((n / total) * 100)
}

function numInput(
  value: number,
  onChange: (v: number) => void,
  opts: { step?: number; min?: number; className?: string } = {},
) {
  return (
    <input
      type="number"
      step={opts.step ?? 0.01}
      min={opts.min ?? 0}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={`rounded-lg px-2 py-1 text-xs border w-20 text-right ${opts.className ?? ''}`}
      style={{ borderColor: 'rgba(188,201,204,0.4)', background: 'rgba(255,255,255,0.85)', color: 'var(--color-on-surface)' }}
    />
  )
}

function SaveBar({ state }: { state: 'idle' | 'saved' | 'error' }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3 mt-3">
      {state === 'saved' && <span className="text-sm font-medium" style={{ color: '#16a34a' }}>✓ {t('admin.config.save_success')}</span>}
      {state === 'error' && <span className="text-sm font-medium" style={{ color: '#dc2626' }}>✗ {t('admin.config.save_error')}</span>}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function DashboardView({ requests }: { requests: MortgageRequest[] }) {
  const { t } = useTranslation()
  const byType = countRequestsByType(requests)
  const totalOpen = Object.values(byType).reduce((s, n) => s + n, 0)

  const advisorLoad = ALL_ADVISORS.map((a) => ({
    ...a,
    count: clientsForAdvisor(requests, a.uid).filter((r) => !r.archived).length,
  }))
  const unassigned = requests.filter((r) => !r.archived && !r.assignedAdvisorUid).length

  const statusCounts: Record<string, number> = {}
  for (const r of requests) {
    if (r.archived) continue
    statusCounts[r.approvalStatus] = (statusCounts[r.approvalStatus] ?? 0) + 1
  }

  return (
    <div className="space-y-8">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <KpiCard label="סה״כ בקשות פתוחות" value={totalOpen} color="var(--color-primary)" />
        {Object.entries(byType).map(([type, count]) => (
          <KpiCard key={type} label={type} value={count} color="var(--color-secondary)" />
        ))}
        <KpiCard label="לא משויך ליועץ" value={unassigned} color="#f59e0b" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Advisor workload */}
        <div className="glass-panel rounded-xl p-5" style={{ border: '1px solid rgba(188,201,204,0.3)' }}>
          <h3 className="font-bold mb-4 text-sm" style={{ color: 'var(--color-on-surface)' }}>
            עומס יועצים
          </h3>
          <div className="space-y-3">
            {advisorLoad.map((a) => (
              <div key={a.uid}>
                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-on-surface-variant)' }}>
                  <span>{a.name}</span>
                  <span className="font-bold">{a.count} לקוחות ({pct(a.count, totalOpen)}%)</span>
                </div>
                <div className="rounded-full h-2 overflow-hidden" style={{ background: 'rgba(188,201,204,0.3)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct(a.count, totalOpen)}%`, background: 'var(--color-primary)' }}
                  />
                </div>
              </div>
            ))}
            {unassigned > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1" style={{ color: '#f59e0b' }}>
                  <span>לא משויך</span>
                  <span className="font-bold">{unassigned} ({pct(unassigned, totalOpen)}%)</span>
                </div>
                <div className="rounded-full h-2 overflow-hidden" style={{ background: 'rgba(188,201,204,0.3)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct(unassigned, totalOpen)}%`, background: '#f59e0b' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Approval status breakdown */}
        <div className="glass-panel rounded-xl p-5" style={{ border: '1px solid rgba(188,201,204,0.3)' }}>
          <h3 className="font-bold mb-4 text-sm" style={{ color: 'var(--color-on-surface)' }}>
            {t('admin.clients.approval_status')} — פילוח
          </h3>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => {
              const color = status === 'אושר' ? '#16a34a' : status === 'נדחה' ? '#dc2626' : '#f59e0b'
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color }}>{status}</span>
                    <span className="font-bold" style={{ color: 'var(--color-on-surface-variant)' }}>{count} ({pct(count, totalOpen)}%)</span>
                  </div>
                  <div className="rounded-full h-2 overflow-hidden" style={{ background: 'rgba(188,201,204,0.3)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct(count, totalOpen)}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="glass-panel rounded-2xl p-7 text-center" style={{ border: '1px solid rgba(188,201,204,0.3)' }}>
      <p className="text-5xl font-bold mb-2" style={{ color, letterSpacing: '-0.02em' }}>{value}</p>
      <p className="text-sm font-semibold" style={{ color: 'var(--color-on-surface-variant)' }}>{label}</p>
    </div>
  )
}

// ── Clients ───────────────────────────────────────────────────────────────────

type ClientDetailTab = 'profile' | 'documents'

function ClientsView({
  requests,
  onAssign,
}: {
  requests: MortgageRequest[]
  onAssign: (requestUid: string, advisorUid: string | null) => void
}) {
  const { t } = useTranslation()
  const [filterAdvisor, setFilterAdvisor] = useState<string>('all')
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const [clientTab, setClientTab] = useState<ClientDetailTab>('profile')
  const [tasks, setTasks] = useState<AdvisorTask[]>([])

  const filtered = filterAdvisor === 'all' ? requests : clientsForAdvisor(requests, filterAdvisor)
  const selected = filtered.find((r) => r.uid === selectedUid) ?? null

  function updateClient(uid: string, patch: Partial<MortgageRequest>) {
    // local state only; wire to Firestore when admin Auth lands
    onAssign(uid, (patch.assignedAdvisorUid as string | null | undefined) ?? (requests.find(r => r.uid === uid)?.assignedAdvisorUid ?? null))
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Left: list */}
      <div className="md:col-span-1 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="rounded-lg px-2 py-1 text-xs border flex-1"
            style={{ borderColor: 'rgba(188,201,204,0.4)', color: 'var(--color-on-surface)', background: 'rgba(255,255,255,0.8)' }}
            value={filterAdvisor}
            onChange={(e) => { setFilterAdvisor(e.target.value); setSelectedUid(null) }}
          >
            <option value="all">{t('admin.clients.all_advisors')}</option>
            {ALL_ADVISORS.map((a) => <option key={a.uid} value={a.uid}>{a.name}</option>)}
            <option value="__unassigned__">לא משויך</option>
          </select>
        </div>

        {(filterAdvisor === '__unassigned__' ? requests.filter(r => !r.assignedAdvisorUid) : filtered).map((r) => {
          const name = r.personal[0] ? `${r.personal[0].first} ${r.personal[0].last}` : r.uid
          const isSelected = r.uid === selectedUid
          return (
            <button
              key={r.uid}
              type="button"
              onClick={() => setSelectedUid(r.uid)}
              className="w-full text-right rounded-2xl transition-all"
              style={{
                padding: '1rem 1.25rem',
                background: isSelected ? 'rgba(0,153,187,0.08)' : 'rgba(255,255,255,0.6)',
                border: `2px solid ${isSelected ? 'var(--color-primary)' : 'rgba(188,201,204,0.3)'}`,
                boxShadow: isSelected ? '0 0 0 3px rgba(0,153,187,0.12)' : 'none',
              }}
            >
              <p className="font-bold text-base" style={{ color: 'var(--color-on-surface)' }}>{name}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
                {r.loanPurpose || 'לא מצוין'} · {r.approvalStatus}
              </p>
              {/* assign dropdown inline */}
              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                <select
                  className="rounded-lg px-3 py-1.5 text-sm border w-full"
                  style={{ borderColor: 'rgba(188,201,204,0.4)', color: 'var(--color-on-surface-variant)', background: 'rgba(255,255,255,0.85)' }}
                  value={r.assignedAdvisorUid ?? ''}
                  onChange={(e) => onAssign(r.uid, e.target.value || null)}
                >
                  <option value="">— {t('admin.clients.unassigned')} —</option>
                  {ALL_ADVISORS.map((a) => <option key={a.uid} value={a.uid}>{a.name}</option>)}
                </select>
              </div>
            </button>
          )
        })}

        {filtered.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{t('admin.clients.empty')}</p>
        )}
      </div>

      {/* Right: detail */}
      <div className="md:col-span-2">
        {selected ? (
          <>
            <div className="flex gap-2 mb-4 border-b" style={{ borderColor: 'rgba(188,201,204,0.3)' }}>
              {(['profile', 'documents'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setClientTab(tab)}
                  className="font-semibold px-3 py-1.5 -mb-px border-b-2 text-sm"
                  style={{
                    borderColor: clientTab === tab ? 'var(--color-primary)' : 'transparent',
                    color: clientTab === tab ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                  }}
                >
                  {t(`advisor.tabs.${tab}`)}
                </button>
              ))}
            </div>
            {clientTab === 'profile' && (
              <ClientProfile
                client={selected}
                onUpdateClient={(patch) => updateClient(selected.uid, patch)}
                tasks={tasks}
                onAddTask={(text) => setTasks(prev => [...prev, { id: `t-${Date.now()}`, advisorUid: 'admin', requestUid: selected.uid, text, done: false, createdAt: new Date().toISOString() }])}
                onUpdateTask={(id, patch) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))}
                onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
              />
            )}
            {clientTab === 'documents' && (
              <DocumentsTab client={selected} onUpdateClient={(patch) => updateClient(selected.uid, patch)} />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-48 rounded-xl glass-panel" style={{ border: '1px solid rgba(188,201,204,0.3)' }}>
            <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
              בחר/י לקוח מהרשימה כדי לראות את הפרופיל שלו
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Config — GeneralRates ─────────────────────────────────────────────────────

function GeneralRatesEditor() {
  const [rates, setRates] = useState<GeneralRates>(defaultGeneralRates)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const { t } = useTranslation()

  function setRate(key: keyof GeneralRates, field: 'anchor' | 'margin', val: number) {
    setRates(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }))
  }

  function save() {
    // In production: await saveConfigToFirestore(db, 'generalRates', rates)
    setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2500)
  }

  return (
    <div>
      <p className="text-xs mb-4" style={{ color: 'var(--color-on-surface-variant)' }}>
        ריביות שוק בסיסיות לפי סוג מסלול — משמשות את מנוע החישוב כאשר "שימוש בריבית שוק" מופעל.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: 'var(--color-on-surface-variant)' }}>
              <th className="text-right px-3 pb-2 font-medium">סוג מסלול</th>
              <th className="text-center px-3 pb-2 font-medium">עוגן (%)</th>
              <th className="text-center px-3 pb-2 font-medium">מרווח (%)</th>
              <th className="text-center px-3 pb-2 font-medium">ריבית אפקטיבית</th>
            </tr>
          </thead>
          <tbody>
            {RATE_KEYS.map((key) => (
              <tr key={key} style={{ borderTop: '1px solid rgba(188,201,204,0.2)' }}>
                <td className="px-3 py-2 text-xs font-medium" style={{ color: 'var(--color-on-surface)' }}>{RATE_KEY_LABELS[key]}</td>
                <td className="px-3 py-2 text-center">
                  {numInput(rates[key].anchor, (v) => setRate(key, 'anchor', v), { step: 0.01 })}
                </td>
                <td className="px-3 py-2 text-center">
                  {numInput(rates[key].margin, (v) => setRate(key, 'margin', v), { step: 0.01 })}
                </td>
                <td className="px-3 py-2 text-center text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
                  {(rates[key].anchor + rates[key].margin).toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button type="button" onClick={save} className="px-5 py-2 rounded-xl font-bold text-sm" style={{ background: 'var(--color-primary)', color: '#fff' }}>
          {t('admin.config.save')}
        </button>
        <SaveBar state={saveState} />
      </div>
    </div>
  )
}

// ── Config — RiskRules ────────────────────────────────────────────────────────

const RISK_KIND_OPTIONS = ['prime', 'variable', 'fixed', 'all'] as const
const RISK_INDEXED_OPTIONS = ['כן', 'לא', 'הכול'] as const

function RiskRulesEditor() {
  const [rules, setRules] = useState<RiskRule[]>(defaultRiskRules)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const { t } = useTranslation()

  function setField<K extends keyof RiskRule>(i: number, field: K, val: RiskRule[K]) {
    setRules(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }

  function addRule() {
    setRules(prev => [...prev, { routeKind: 'fixed', fromMonths: 1, toMonths: 360, indexed: 'לא', exitPenalty: 'בינוני', risk: 2 }])
  }

  function removeRule(i: number) {
    setRules(prev => prev.filter((_, idx) => idx !== i))
  }

  function save() {
    setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2500)
  }

  const riskColor = (r: number) => r <= 1 ? '#16a34a' : r <= 2 ? '#f59e0b' : r <= 3 ? '#ea580c' : '#dc2626'

  return (
    <div>
      <p className="text-xs mb-4" style={{ color: 'var(--color-on-surface-variant)' }}>
        כללי הסיכון קובעים את ציון הסיכון לכל מסלול בתמהיל — משפיעים על ספידומטר הסיכון.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ color: 'var(--color-on-surface-variant)' }}>
              <th className="text-right px-2 pb-2 font-medium">סוג מסלול</th>
              <th className="text-center px-2 pb-2 font-medium">מ (חודשים)</th>
              <th className="text-center px-2 pb-2 font-medium">עד (חודשים)</th>
              <th className="text-center px-2 pb-2 font-medium">צמוד</th>
              <th className="text-center px-2 pb-2 font-medium">קנס יציאה</th>
              <th className="text-center px-2 pb-2 font-medium">ציון סיכון</th>
              <th className="px-2 pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgba(188,201,204,0.2)' }}>
                <td className="px-2 py-2">
                  <select
                    value={rule.routeKind}
                    onChange={(e) => setField(i, 'routeKind', e.target.value as RiskRule['routeKind'])}
                    className="rounded px-2 py-1 border text-xs"
                    style={{ borderColor: 'rgba(188,201,204,0.4)', background: 'rgba(255,255,255,0.85)' }}
                  >
                    {RISK_KIND_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </td>
                <td className="px-2 py-2 text-center">
                  {numInput(rule.fromMonths, (v) => setField(i, 'fromMonths', v), { step: 1, min: 1 })}
                </td>
                <td className="px-2 py-2 text-center">
                  {numInput(rule.toMonths, (v) => setField(i, 'toMonths', v), { step: 1, min: 1 })}
                </td>
                <td className="px-2 py-2 text-center">
                  <select
                    value={rule.indexed}
                    onChange={(e) => setField(i, 'indexed', e.target.value as RiskRule['indexed'])}
                    className="rounded px-2 py-1 border text-xs"
                    style={{ borderColor: 'rgba(188,201,204,0.4)', background: 'rgba(255,255,255,0.85)' }}
                  >
                    {RISK_INDEXED_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td className="px-2 py-2 text-center">
                  <input
                    value={rule.exitPenalty}
                    onChange={(e) => setField(i, 'exitPenalty', e.target.value)}
                    className="rounded px-2 py-1 border text-xs w-20"
                    style={{ borderColor: 'rgba(188,201,204,0.4)', background: 'rgba(255,255,255,0.85)' }}
                  />
                </td>
                <td className="px-2 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {numInput(rule.risk, (v) => setField(i, 'risk', Math.min(5, Math.max(1, Math.round(v)))), { step: 1, min: 1 })}
                    <span className="text-lg font-bold" style={{ color: riskColor(rule.risk) }}>●</span>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => removeRule(i)}
                    className="text-xs px-2 py-1 rounded"
                    style={{ color: '#dc2626', background: 'rgba(220,38,38,0.08)' }}
                  >
                    הסר
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 mt-4 flex-wrap">
        <button
          type="button" onClick={addRule}
          className="px-4 py-1.5 rounded-xl text-sm border font-medium"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
        >
          + הוסף כלל
        </button>
        <button type="button" onClick={save} className="px-5 py-2 rounded-xl font-bold text-sm" style={{ background: 'var(--color-primary)', color: '#fff' }}>
          {t('admin.config.save')}
        </button>
        <SaveBar state={saveState} />
      </div>
    </div>
  )
}

// ── Config — ClockTemplates ───────────────────────────────────────────────────

const KIND_LABELS: Record<string, string> = { fixed: 'קבועה', variable: 'משתנה', prime: 'פריים' }
const KIND_OPTIONS = ['fixed', 'variable', 'prime'] as const

function ClockTemplatesEditor() {
  const [templates, setTemplates] = useState<ClockTemplates>(defaultClockTemplates)
  const [activeKey, setActiveKey] = useState<string>('clock1')
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const { t } = useTranslation()

  const tmpl = templates[activeKey]
  const totalShare = tmpl.routes.reduce((s, r) => s + r.sharePct, 0)

  function setRoute(i: number, field: string, val: unknown) {
    setTemplates(prev => ({
      ...prev,
      [activeKey]: {
        ...prev[activeKey],
        routes: prev[activeKey].routes.map((r, idx) => idx === i ? { ...r, [field]: val } : r),
      },
    }))
  }

  function setName(name: string) {
    setTemplates(prev => ({ ...prev, [activeKey]: { ...prev[activeKey], name } }))
  }

  function save() {
    setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2500)
  }

  return (
    <div>
      <p className="text-xs mb-4" style={{ color: 'var(--color-on-surface-variant)' }}>
        5 תבניות תמהיל (שעונים) — מגדירות את ברירת המחדל של הרכב המסלולים המוצעים ללקוח.
      </p>

      {/* Clock selector */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {Object.keys(templates).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveKey(key)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
            style={{
              background: activeKey === key ? 'var(--color-primary)' : 'rgba(255,255,255,0.7)',
              color: activeKey === key ? '#fff' : 'var(--color-on-surface-variant)',
              borderColor: activeKey === key ? 'var(--color-primary)' : 'rgba(188,201,204,0.4)',
            }}
          >
            {templates[key].name}
          </button>
        ))}
      </div>

      {/* Name */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-xs font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>שם התבנית:</label>
        <input
          value={tmpl.name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg px-3 py-1 text-sm border"
          style={{ borderColor: 'rgba(188,201,204,0.4)', background: 'rgba(255,255,255,0.85)', color: 'var(--color-on-surface)' }}
        />
      </div>

      {/* Routes table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ color: 'var(--color-on-surface-variant)' }}>
              <th className="text-right px-2 pb-2 font-medium">סוג</th>
              <th className="text-center px-2 pb-2 font-medium">צמודה</th>
              <th className="text-center px-2 pb-2 font-medium">% מהתמהיל</th>
              <th className="text-center px-2 pb-2 font-medium">עוגן (%)</th>
              <th className="text-center px-2 pb-2 font-medium">שינוי (חו׳)</th>
            </tr>
          </thead>
          <tbody>
            {tmpl.routes.map((route, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgba(188,201,204,0.2)' }}>
                <td className="px-2 py-2">
                  <select
                    value={route.kind}
                    onChange={(e) => setRoute(i, 'kind', e.target.value)}
                    className="rounded px-2 py-1 border text-xs"
                    style={{ borderColor: 'rgba(188,201,204,0.4)', background: 'rgba(255,255,255,0.85)' }}
                  >
                    {KIND_OPTIONS.map(k => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
                  </select>
                </td>
                <td className="px-2 py-2 text-center">
                  <select
                    value={route.indexType}
                    onChange={(e) => setRoute(i, 'indexType', e.target.value)}
                    className="rounded px-2 py-1 border text-xs"
                    style={{ borderColor: 'rgba(188,201,204,0.4)', background: 'rgba(255,255,255,0.85)' }}
                  >
                    <option value="ללא">לא</option>
                    <option value="מדד">כן</option>
                  </select>
                </td>
                <td className="px-2 py-2 text-center">
                  {numInput(route.sharePct, (v) => setRoute(i, 'sharePct', v), { step: 1, min: 0 })}
                  <span className="mr-1 text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>%</span>
                </td>
                <td className="px-2 py-2 text-center">
                  {numInput(route.anchor, (v) => setRoute(i, 'anchor', v), { step: 0.01 })}
                </td>
                <td className="px-2 py-2 text-center">
                  {route.kind !== 'fixed' && route.kind !== 'prime'
                    ? numInput(route.changeMonths ?? 60, (v) => setRoute(i, 'changeMonths', v), { step: 1, min: 1 })
                    : <span style={{ color: 'var(--color-on-surface-variant)' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid rgba(188,201,204,0.3)' }}>
              <td colSpan={2} className="px-2 py-2 text-xs font-bold" style={{ color: 'var(--color-on-surface-variant)' }}>סה״כ</td>
              <td className="px-2 py-2 text-center text-xs font-bold"
                style={{ color: totalShare === 100 ? '#16a34a' : '#dc2626' }}>
                {totalShare}%
                {totalShare !== 100 && <span className="mr-1 text-xs">(חייב להיות 100%)</span>}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button type="button" onClick={save} className="px-5 py-2 rounded-xl font-bold text-sm" style={{ background: 'var(--color-primary)', color: '#fff' }}>
          {t('admin.config.save')}
        </button>
        <SaveBar state={saveState} />
      </div>
    </div>
  )
}

// ── Config — MonthlyIndices ───────────────────────────────────────────────────

function MonthlyIndicesEditor() {
  const [config, setConfig] = useState<IndicesConfig>(defaultIndicesConfig)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const { t } = useTranslation()

  function setEntry(i: number, field: 'month' | 'rate', val: string | number) {
    setConfig(prev => ({
      ...prev,
      entries: prev.entries.map((e, idx) => idx === i ? { ...e, [field]: val } : e),
    }))
  }

  function addEntry() {
    setConfig(prev => ({
      ...prev,
      entries: [...prev.entries, { month: '', rate: 0 }],
    }))
  }

  function removeEntry(i: number) {
    setConfig(prev => ({ ...prev, entries: prev.entries.filter((_, idx) => idx !== i) }))
  }

  function save() {
    setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2500)
  }

  return (
    <div>
      <p className="text-xs mb-4" style={{ color: 'var(--color-on-surface-variant)' }}>
        ערכי מדד המחירים לצרכן בפועל — משמשים לחישוב הצמדה מדויקת בלוח הסילוקין.
      </p>

      {/* Annual expected */}
      <div className="glass-panel rounded-xl p-4 mb-5 flex items-center gap-4" style={{ border: '1px solid rgba(188,201,204,0.3)' }}>
        <span className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>מדד שנתי צפוי (%):</span>
        <div className="flex items-center gap-2">
          {numInput(config.annualExpected, (v) => setConfig(prev => ({ ...prev, annualExpected: v })), { step: 0.1, min: -5 })}
          <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
            משמש כהנחת ברירת מחדל כאשר אין ערך חודשי בפועל
          </span>
        </div>
      </div>

      {/* Monthly entries */}
      <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--color-on-surface)' }}>ערכים חודשיים בפועל</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ color: 'var(--color-on-surface-variant)' }}>
              <th className="text-right px-2 pb-2 font-medium">חודש (YYYY-MM)</th>
              <th className="text-center px-2 pb-2 font-medium">שינוי (%)</th>
              <th className="px-2 pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {config.entries.map((entry, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgba(188,201,204,0.2)' }}>
                <td className="px-2 py-2">
                  <input
                    value={entry.month}
                    onChange={(e) => setEntry(i, 'month', e.target.value)}
                    placeholder="2026-06"
                    className="rounded px-2 py-1 border text-xs w-28"
                    style={{ borderColor: 'rgba(188,201,204,0.4)', background: 'rgba(255,255,255,0.85)' }}
                  />
                </td>
                <td className="px-2 py-2 text-center">
                  {numInput(entry.rate, (v) => setEntry(i, 'rate', v), { step: 0.01 })}
                </td>
                <td className="px-2 py-2">
                  <button
                    type="button" onClick={() => removeEntry(i)}
                    className="text-xs px-2 py-1 rounded"
                    style={{ color: '#dc2626', background: 'rgba(220,38,38,0.08)' }}
                  >
                    הסר
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 mt-4 flex-wrap">
        <button
          type="button" onClick={addEntry}
          className="px-4 py-1.5 rounded-xl text-sm border font-medium"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
        >
          + הוסף חודש
        </button>
        <button type="button" onClick={save} className="px-5 py-2 rounded-xl font-bold text-sm" style={{ background: 'var(--color-primary)', color: '#fff' }}>
          {t('admin.config.save')}
        </button>
        <SaveBar state={saveState} />
      </div>
    </div>
  )
}

// ── Config shell ──────────────────────────────────────────────────────────────

const CONFIG_TABS: { key: ConfigTab; label: string }[] = [
  { key: 'generalRates', label: 'ריביות שוק' },
  { key: 'riskRules', label: 'כללי סיכון' },
  { key: 'clockTemplates', label: 'תבניות שעונים' },
  { key: 'monthlyIndices', label: 'מדדים חודשיים' },
]

function ConfigView() {
  const [activeTab, setActiveTab] = useState<ConfigTab>('generalRates')

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b flex-wrap" style={{ borderColor: 'rgba(188,201,204,0.4)' }}>
        {CONFIG_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className="font-semibold px-4 py-2 -mb-px border-b-2 text-sm"
            style={{
              borderColor: activeTab === key ? 'var(--color-primary)' : 'transparent',
              color: activeTab === key ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="glass-panel rounded-xl p-5" style={{ border: '1px solid rgba(188,201,204,0.3)' }}>
        {activeTab === 'generalRates' && <GeneralRatesEditor />}
        {activeTab === 'riskRules' && <RiskRulesEditor />}
        {activeTab === 'clockTemplates' && <ClockTemplatesEditor />}
        {activeTab === 'monthlyIndices' && <MonthlyIndicesEditor />}
      </div>
    </div>
  )
}

// ── AdminScreen ───────────────────────────────────────────────────────────────

export function AdminScreen() {
  const { t } = useTranslation()
  const [requests, setRequests] = useState<MortgageRequest[]>(seedRequests)
  const [view, setView] = useState<AdminView>('dashboard')

  function handleAssign(requestUid: string, advisorUid: string | null) {
    setRequests((prev) => prev.map((r) => (r.uid === requestUid ? { ...r, assignedAdvisorUid: advisorUid } : r)))
    // In production: assignAdvisorInFirestore(db, requestUid, advisorUid)
  }

  const VIEWS: { key: AdminView; label: string }[] = [
    { key: 'dashboard', label: t('admin.views.dashboard') },
    { key: 'clients', label: t('admin.views.clients') },
    { key: 'config', label: t('admin.views.config') },
  ]

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto">
        <h1
          className="text-2xl font-bold mb-6"
          style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}
        >
          {t('admin.title')}
        </h1>

        <div className="flex gap-1 mb-8 border-b" style={{ borderColor: 'rgba(188,201,204,0.4)' }}>
          {VIEWS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className="-mb-px border-b-[3px] transition-colors"
              style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.05rem',
                fontWeight: 700,
                padding: '0.85rem 1.75rem',
                borderColor: view === key ? 'var(--color-primary)' : 'transparent',
                color: view === key ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                background: view === key ? 'rgba(0,153,187,0.05)' : 'transparent',
                borderRadius: '6px 6px 0 0',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {view === 'dashboard' && <DashboardView requests={requests} />}
        {view === 'clients' && <ClientsView requests={requests} onAssign={handleAssign} />}
        {view === 'config' && <ConfigView />}
      </div>
    </PageShell>
  )
}
