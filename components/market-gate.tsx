'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowRight, RefreshCw, X } from 'lucide-react'

const SESSION_KEY = 'mutualfund:aex-intro-dismissed'
export const MARKET_OPEN_EVENT = 'mutualfund:market-open'
const ranges = ['1D', '1W', '1M', '1Y', '5Y'] as const
type MarketRange = (typeof ranges)[number]

type MarketPoint = {
  timestamp: number
  value: number
  open: number | null
  high: number | null
  low: number | null
  percent?: number
}

type MarketData = {
  symbol: string
  name: string
  currency: string
  exchange: string
  range: MarketRange
  price: number
  change: number | null
  changePercent: number | null
  open: number | null
  high: number | null
  low: number | null
  previousClose: number | null
  lastUpdated: number
  delayLabel: string
  source: string
  points: MarketPoint[]
}

const numberFormat = new Intl.NumberFormat('nl-NL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatNumber(value: number | null) {
  return value === null ? '—' : numberFormat.format(value)
}

function formatSigned(value: number | null, suffix = '') {
  if (value === null) return '—'
  return `${value >= 0 ? '+' : ''}${numberFormat.format(value)}${suffix}`
}

function formatChartDate(timestamp: number, range: MarketRange) {
  const options: Intl.DateTimeFormatOptions =
    range === '1D'
      ? { hour: '2-digit', minute: '2-digit' }
      : range === '1W' || range === '1M'
        ? { day: 'numeric', month: 'short' }
        : { month: 'short', year: '2-digit' }
  return new Intl.DateTimeFormat('nl-NL', options).format(timestamp)
}

function MarketTooltip({ active, payload, range }: any) {
  const point = payload?.[0]?.payload as MarketPoint | undefined
  if (!active || !point) return null

  return (
    <div className="market-tooltip">
      <span>
        {new Intl.DateTimeFormat('nl-NL', {
          day: '2-digit',
          month: 'short',
          year: range === '1D' ? undefined : 'numeric',
          hour: range === '1D' || range === '1W' ? '2-digit' : undefined,
          minute: range === '1D' || range === '1W' ? '2-digit' : undefined,
        }).format(point.timestamp)}
      </span>
      <strong>{numberFormat.format(point.value)}</strong>
      <em className={(point.percent ?? 0) >= 0 ? 'is-positive' : 'is-negative'}>
        {formatSigned(point.percent ?? null, '%')}
      </em>
    </div>
  )
}

export function MarketGate() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [range, setRange] = useState<MarketRange>('1D')
  const [retryKey, setRetryKey] = useState(0)
  const [data, setData] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const gradientId = useId().replace(/:/g, '')

  useEffect(() => {
    try {
      if (!window.sessionStorage.getItem(SESSION_KEY)) {
        previousFocusRef.current = document.activeElement as HTMLElement | null
        setOpen(true)
      }
    } catch {
      previousFocusRef.current = document.activeElement as HTMLElement | null
      setOpen(true)
    }

    const reopen = () => {
      previousFocusRef.current = document.activeElement as HTMLElement | null
      setClosing(false)
      setOpen(true)
    }
    window.addEventListener(MARKET_OPEN_EVENT, reopen)
    return () => window.removeEventListener(MARKET_OPEN_EVENT, reopen)
  }, [])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.setTimeout(() => closeButtonRef.current?.focus(), 30)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
      if (event.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetch(`/api/market/aex?range=${range}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || 'De marktdata kon niet worden geladen.')
        return payload as MarketData
      })
      .then(setData)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setData(null)
          setError(requestError.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [open, range, retryKey])

  const chartData = useMemo(() => {
    if (!data?.points.length) return []
    const base = data.points[0].value
    return data.points.map((point) => ({
      ...point,
      percent: base === 0 ? 0 : ((point.value - base) / base) * 100,
    }))
  }, [data])

  const positive = (data?.change ?? 0) >= 0
  const chartColor = positive ? '#78c5a4' : '#e47f78'

  function dismiss() {
    try {
      window.sessionStorage.setItem(SESSION_KEY, 'true')
    } catch {
      // The intro still closes when browser storage is unavailable.
    }
    setClosing(true)
    window.setTimeout(() => {
      setOpen(false)
      setClosing(false)
      previousFocusRef.current?.focus()
    }, 260)
  }

  if (!open) return null

  return (
    <div
      ref={dialogRef}
      className="market-gate"
      data-closing={closing ? 'true' : 'false'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="market-gate-title"
      aria-describedby="market-gate-description"
    >
      <div className="market-gate__noise" aria-hidden="true" />
      <header className="market-gate__header">
        <div className="market-gate__brand">
          <span className="market-gate__monogram" aria-hidden="true">MF</span>
          <div>
            <strong>Mutual Fund</strong>
            <span>Amsterdam · sinds 2010</span>
          </div>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={dismiss}
          className="market-gate__close"
          aria-label="Sluit AEX-intro en open de website"
        >
          <span>Sluiten</span>
          <X aria-hidden="true" size={20} strokeWidth={1.6} />
        </button>
      </header>

      <main className="market-gate__main">
        <section className="market-gate__title-row">
          <div>
            <p className="market-gate__kicker">Euronext Amsterdam / AEX</p>
            <h1 id="market-gate-title">Markets in motion.</h1>
            <p id="market-gate-description">
              Mutual Fund brengt studenten, echt kapitaal en kritische marktanalyse samen.
            </p>
          </div>
          <div className="market-quote" aria-live="polite">
            <span>AEX</span>
            <strong>{data ? formatNumber(data.price) : '—'}</strong>
            <em className={positive ? 'is-positive' : 'is-negative'}>
              {data ? `${formatSigned(data.change)} · ${formatSigned(data.changePercent, '%')}` : 'Marktdata laden'}
            </em>
          </div>
        </section>

        <section className="market-chart-shell" aria-label={`AEX-koersgrafiek over ${range}`}>
          <div className="market-chart__toolbar">
            <div className="market-ranges" aria-label="Kies een tijdsbereik">
              {ranges.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={range === item ? 'is-active' : ''}
                  aria-pressed={range === item}
                  onClick={() => setRange(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="market-status">
              <span className="market-status__dot" />
              {data?.delayLabel ?? 'Dataverbinding controleren'}
            </div>
          </div>

          <div className="market-chart__canvas">
            {loading ? (
              <div className="market-loading" role="status">
                <span className="market-loading__line" />
                <p>Koersdata wordt geladen</p>
              </div>
            ) : error ? (
              <div className="market-error" role="alert">
                <span>Datafeed onderbroken</span>
                <h2>AEX tijdelijk niet beschikbaar</h2>
                <p>{error}</p>
                <button type="button" onClick={() => setRetryKey((value) => value + 1)}>
                  <RefreshCw size={15} aria-hidden="true" /> Opnieuw proberen
                </button>
              </div>
            ) : chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 22, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="78%" stopColor={chartColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(247,243,236,.10)" strokeDasharray="2 6" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => formatChartDate(value, range)}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={42}
                    tick={{ fill: 'rgba(247,243,236,.5)', fontSize: 11 }}
                  />
                  <YAxis
                    orientation="right"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(value) => numberFormat.format(value)}
                    axisLine={false}
                    tickLine={false}
                    width={62}
                    tick={{ fill: 'rgba(247,243,236,.5)', fontSize: 11 }}
                  />
                  <Tooltip content={<MarketTooltip range={range} />} cursor={{ stroke: 'rgba(184,146,74,.55)', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartColor}
                    strokeWidth={2.2}
                    fill={`url(#${gradientId})`}
                    activeDot={{ r: 4, fill: chartColor, stroke: '#061429', strokeWidth: 2 }}
                    isAnimationActive
                    animationDuration={650}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </div>

          <dl className="market-metrics">
            {[
              ['Opening', data?.open ?? null],
              ['Daghoogte', data?.high ?? null],
              ['Daglaagte', data?.low ?? null],
              ['Vorige slot', data?.previousClose ?? null],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <dt>{label}</dt>
                <dd>{formatNumber(value as number | null)}</dd>
              </div>
            ))}
            <div className="market-metrics__update">
              <dt>Laatste update</dt>
              <dd>
                {data
                  ? new Intl.DateTimeFormat('nl-NL', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(data.lastUpdated)
                  : '—'}
              </dd>
            </div>
          </dl>
        </section>
      </main>

      <footer className="market-gate__footer">
        <p>
          {data ? `${data.source} · ${data.delayLabel}` : 'Koersen worden nooit gesimuleerd.'}
        </p>
        <button type="button" onClick={dismiss} className="market-enter">
          Enter Mutual Fund <ArrowRight aria-hidden="true" size={18} />
        </button>
      </footer>
    </div>
  )
}
