import { NextResponse } from 'next/server'

export const revalidate = 60

const RANGE_CONFIG = {
  '1D': { range: '1d', interval: '5m' },
  '1W': { range: '5d', interval: '30m' },
  '1M': { range: '1mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  '5Y': { range: '5y', interval: '1wk' },
} as const

type MarketRange = keyof typeof RANGE_CONFIG

type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: Record<string, number | string | undefined>
      timestamp?: number[]
      indicators?: {
        quote?: Array<{
          open?: Array<number | null>
          high?: Array<number | null>
          low?: Array<number | null>
          close?: Array<number | null>
        }>
      }
    }>
    error?: { description?: string } | null
  }
}

function numeric(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

async function fetchYahooChart(host: string, range: MarketRange) {
  const config = RANGE_CONFIG[range]
  const url = new URL(`https://${host}/v8/finance/chart/%5EAEX`)
  url.searchParams.set('range', config.range)
  url.searchParams.set('interval', config.interval)
  url.searchParams.set('includePrePost', 'false')
  url.searchParams.set('events', 'div,splits')

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; MutualFundAmsterdam/1.0)',
    },
    next: { revalidate: 60 },
  })

  if (!response.ok) throw new Error(`Market data provider returned ${response.status}`)
  return (await response.json()) as YahooChart
}

export async function GET(request: Request) {
  const requestedRange = new URL(request.url).searchParams.get('range')?.toUpperCase() ?? '1D'

  if (!(requestedRange in RANGE_CONFIG)) {
    return NextResponse.json({ error: 'Ongeldig tijdsbereik.' }, { status: 400 })
  }

  const range = requestedRange as MarketRange

  try {
    let payload: YahooChart | null = null
    let lastError: unknown = null

    for (const host of ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']) {
      try {
        payload = await fetchYahooChart(host, range)
        if (payload.chart?.result?.[0]) break
      } catch (error) {
        lastError = error
      }
    }

    const result = payload?.chart?.result?.[0]
    if (!result) {
      throw lastError ?? new Error(payload?.chart?.error?.description ?? 'Geen marktdata ontvangen')
    }

    const meta = result.meta ?? {}
    const timestamps = result.timestamp ?? []
    const quote = result.indicators?.quote?.[0] ?? {}
    const closes = quote.close ?? []
    const opens = quote.open ?? []
    const highs = quote.high ?? []
    const lows = quote.low ?? []

    const points = timestamps.flatMap((timestamp, index) => {
      const close = numeric(closes[index])
      if (close === null) return []
      return [
        {
          timestamp: timestamp * 1000,
          value: close,
          open: numeric(opens[index]),
          high: numeric(highs[index]),
          low: numeric(lows[index]),
        },
      ]
    })

    if (!points.length) throw new Error('De dataleverancier stuurde geen bruikbare koerspunten.')

    const latest = points.at(-1)!
    const price = numeric(meta.regularMarketPrice) ?? latest.value
    const previousClose =
      numeric(meta.chartPreviousClose) ?? numeric(meta.previousClose) ?? points[0]?.value ?? null
    const change = previousClose === null ? null : price - previousClose
    const changePercent =
      previousClose === null || previousClose === 0 ? null : (change! / previousClose) * 100

    const dayHigh = numeric(meta.regularMarketDayHigh)
    const dayLow = numeric(meta.regularMarketDayLow)
    const dayOpen = numeric(meta.regularMarketOpen)

    return NextResponse.json(
      {
        symbol: '^AEX',
        name: 'AEX Index',
        currency: String(meta.currency ?? 'EUR'),
        exchange: String(meta.exchangeName ?? 'Euronext Amsterdam'),
        range,
        price,
        change,
        changePercent,
        open: dayOpen ?? points.at(-1)?.open ?? null,
        high: dayHigh ?? points.at(-1)?.high ?? null,
        low: dayLow ?? points.at(-1)?.low ?? null,
        previousClose,
        lastUpdated: latest.timestamp,
        delayLabel: 'Vertraagde marktdata',
        source: 'Yahoo Finance',
        points,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    )
  } catch (error) {
    console.error('AEX market data request failed', error)
    return NextResponse.json(
      {
        error:
          'De AEX-koers is tijdelijk niet beschikbaar. Probeer het over enkele ogenblikken opnieuw.',
      },
      { status: 503 },
    )
  }
}
