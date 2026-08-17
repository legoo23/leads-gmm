import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import AuthHashHandler from "@/components/AuthHashHandler"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: { default: "iHelp Medica", template: "%s · iHelp Medica" },
  description: "Gestión de leads para procedimientos quirúrgicos con seguro GMM",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="h-full">
        <AuthHashHandler />
        {children}
      </body>
    </html>
  )
}
