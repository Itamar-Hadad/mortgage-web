interface Props {
  level: number // 1-5
  label: string
}

const COLORS = ['#22c55e', '#86efac', '#facc15', '#f97316', '#ef4444']
const NEEDLE_ANGLES = [-80, -40, 0, 40, 80] // degrees from vertical (pointing up = 0)

export function Speedometer({ level, label }: Props) {
  const idx = Math.min(5, Math.max(1, level)) - 1
  const color = COLORS[idx]
  const needleAngle = NEEDLE_ANGLES[idx]

  // SVG semi-circle gauge: cx=60, cy=60, r=50
  // Arc goes from 180° to 0° (left to right)
  const segments = COLORS.map((c, i) => {
    const startDeg = 180 - i * 36
    const endDeg = 180 - (i + 1) * 36
    const toRad = (d: number) => (d * Math.PI) / 180
    const x1 = 60 + 50 * Math.cos(toRad(startDeg))
    const y1 = 60 - 50 * Math.sin(toRad(startDeg))
    const x2 = 60 + 50 * Math.cos(toRad(endDeg))
    const y2 = 60 - 50 * Math.sin(toRad(endDeg))
    const xi1 = 60 + 32 * Math.cos(toRad(startDeg))
    const yi1 = 60 - 32 * Math.sin(toRad(startDeg))
    const xi2 = 60 + 32 * Math.cos(toRad(endDeg))
    const yi2 = 60 - 32 * Math.sin(toRad(endDeg))
    return { c, x1, y1, x2, y2, xi1, yi1, xi2, yi2 }
  })

  // Needle: rotated from center pointing up, then rotated by needleAngle
  const needleRad = ((90 - needleAngle) * Math.PI) / 180
  const nx = 60 + 42 * Math.cos(needleRad)
  const ny = 60 - 42 * Math.sin(needleRad)

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="120" height="70" viewBox="0 0 120 70" aria-label={`רמת סיכון: ${label}`}>
        {segments.map((s, i) => (
          <path
            key={i}
            d={`M ${s.xi1} ${s.yi1} L ${s.x1} ${s.y1} A 50 50 0 0 0 ${s.x2} ${s.y2} L ${s.xi2} ${s.yi2} A 32 32 0 0 1 ${s.xi1} ${s.yi1} Z`}
            fill={s.c}
            opacity={i === idx ? 1 : 0.25}
          />
        ))}
        {/* Needle */}
        <line x1="60" y1="60" x2={nx} y2={ny} stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="60" cy="60" r="5" fill="#111" />
      </svg>
      <span className="text-xs font-bold" style={{ color }}>
        {label}
      </span>
    </div>
  )
}
