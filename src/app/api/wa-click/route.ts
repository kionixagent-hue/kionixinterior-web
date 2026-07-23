import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { source } = await req.json()
  const page = req.headers.get('referer') ?? ''
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL

  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        body: JSON.stringify({ timestamp: new Date().toISOString(), source, page }),
      })
    } catch {
      // ponytail: best-effort logging, a failed sheet write shouldn't break the WA button
    }
  }

  return NextResponse.json({ ok: true })
}
