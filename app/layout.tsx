import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/lib/auth"
import { CacheProvider } from "@/components/providers/cache-provider"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Braunwell CRM",
  description: "Modern CRM for UK businesses",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CacheProvider>
            {children}
            <Toaster />
          </CacheProvider>
        </AuthProvider>
      </body>
    </html>
  )
}