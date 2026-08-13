import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"
import { assertLicense } from "@/lib/license"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ihelpmedica.mx"

type Params = { params: Promise<{ codigo: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  assertLicense()
  const { codigo } = await params
  const download = req.nextUrl.searchParams.get("download") === "1"

  const url = `${APP_URL}/r/${codigo.toUpperCase()}`

  const buffer = await QRCode.toBuffer(url, {
    type:   "png",
    width:  400,
    margin: 2,
    color:  { dark: "#0F6E56", light: "#FFFFFF" },
  })

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":  "image/png",
      "Cache-Control": "public, max-age=86400",
      ...(download && {
        "Content-Disposition": `attachment; filename="QR-${codigo.toUpperCase()}.png"`,
      }),
    },
  })
}
