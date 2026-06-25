import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Chart,
  BarElement,
  LineElement,
  PointElement,
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
} from 'chart.js'
import type { MixCalc } from '../../calc-engine/types'

Chart.register(BarElement, LineElement, PointElement, BarController, LineController, CategoryScale, LinearScale, Legend, Tooltip)

declare global {
  interface Window {
    _charts: Record<string, Chart>
  }
}
if (!window._charts) window._charts = {}

function fmt(n: number) {
  return Math.round(n).toLocaleString('he-IL')
}

interface Props {
  calc: MixCalc
  mixId: string
}

export function MixDetailChart({ calc, mixId }: Props) {
  const { t } = useTranslation()
  const monthlyRef = useRef<HTMLCanvasElement>(null)
  const cumulativeRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!monthlyRef.current || !cumulativeRef.current) return

    const maxN = calc.maxN
    const labels: string[] = []
    const prinArr: number[] = []
    const intrArr: number[] = []
    const cumPrin: number[] = []
    const cumIntr: number[] = []

    let runPrin = 0
    let runIntr = 0

    for (let i = 0; i < maxN; i++) {
      const month = i + 1
      if (month % 12 === 1 || maxN <= 60) {
        labels.push(t('results.chart_month', { n: month }))
        let p = 0, intr = 0
        for (const r of calc.per) {
          p += r.prin[i] ?? 0
          intr += r.intr[i] ?? 0
        }
        runPrin += p
        runIntr += intr
        prinArr.push(p)
        intrArr.push(intr)
        cumPrin.push(runPrin)
        cumIntr.push(runIntr)
      }
    }

    const monthlyId = `monthly-${mixId}`
    const cumulativeId = `cumulative-${mixId}`

    if (window._charts[monthlyId]) { window._charts[monthlyId].destroy() }
    if (window._charts[cumulativeId]) { window._charts[cumulativeId].destroy() }

    window._charts[monthlyId] = new Chart(monthlyRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: t('results.chart_principal'), data: prinArr, backgroundColor: 'rgba(0,104,117,0.7)', stack: 'a' },
          { label: t('results.chart_interest'), data: intrArr, backgroundColor: 'rgba(90,215,235,0.7)', stack: 'a' },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ₪${fmt(Number(ctx.parsed.y))}` } } },
        scales: { x: { stacked: true }, y: { stacked: true } },
      },
    })

    window._charts[cumulativeId] = new Chart(cumulativeRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: t('results.chart_principal_cumulative'), data: cumPrin, borderColor: '#006875', backgroundColor: 'rgba(0,104,117,0.1)', fill: true, tension: 0.3 },
          { label: t('results.chart_interest_cumulative'), data: cumIntr, borderColor: '#5ad7eb', backgroundColor: 'rgba(90,215,235,0.1)', fill: true, tension: 0.3 },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ₪${fmt(Number(ctx.parsed.y))}` } } },
      },
    })

    return () => {
      if (window._charts[monthlyId]) { window._charts[monthlyId].destroy(); delete window._charts[monthlyId] }
      if (window._charts[cumulativeId]) { window._charts[cumulativeId].destroy(); delete window._charts[cumulativeId] }
    }
  }, [calc, mixId, t])

  return (
    <div className="mt-4 flex flex-col gap-6">
      <div>
        <p className="text-sm font-bold mb-2" style={{ color: 'var(--color-on-surface-variant)' }}>{t('results.chart_monthly_title')}</p>
        <canvas ref={monthlyRef} />
      </div>
      <div>
        <p className="text-sm font-bold mb-2" style={{ color: 'var(--color-on-surface-variant)' }}>{t('results.chart_cumulative_title')}</p>
        <canvas ref={cumulativeRef} />
      </div>
    </div>
  )
}
