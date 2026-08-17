import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Script from "next/script"
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
        <Script id="webchat-init" strategy="afterInteractive">{`
          (function () {
            const s = document.createElement("script");
            s.src = "https://s3.us-east-1.amazonaws.com/webchat.us1.bundles/channel-bundles/f0314195-5787-4d60-980e-270f9bb0cbad/ff80be8f-d55d-4f3b-91d6-06a2e1e15b03/ff80be8f-d55d-4f3b-91d6-06a2e1e15b03.bundle.js";
            s.async = true;
            s.charset = "UTF-8";
            s.onload = function () { window.Webchat.init(); };
            document.head.appendChild(s);
          })();
        `}</Script>
      </body>
    </html>
  )
}
