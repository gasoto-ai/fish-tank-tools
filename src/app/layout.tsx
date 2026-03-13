import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Fish Tank Tools",
  description: "Workflow tools for the Ren + Forge system",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-stone-950 text-stone-100 antialiased">
        {children}
      </body>
    </html>
  )
}
