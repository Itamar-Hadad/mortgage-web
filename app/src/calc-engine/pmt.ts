export function PMT(r: number, n: number, pv: number): number {
  if (n <= 0) return 0
  if (r === 0) return -pv / n
  return -(r * pv) / (1 - Math.pow(1 + r, -n))
}