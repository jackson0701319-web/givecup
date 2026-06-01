import type { Metadata } from 'next'
import { Noto_Sans_KR, Roboto_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { readSupabasePublicEnvFromProcess } from '@/lib/supabase/public-env'
import './globals.css'

const notoSansKR = Noto_Sans_KR({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans"
});
const robotoMono = Roboto_Mono({ 
  subsets: ["latin"],
  variable: "--font-roboto-mono"
});

export const metadata: Metadata = {
  title: 'GiveCup · 기브컵 — 전 세계 기부 축제',
  description:
    '월드컵처럼 전 세계가 하나 되어 즐기는 기부 축제. 국가별 순위로 함께 나눔에 참여하세요.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabasePublicEnv = readSupabasePublicEnvFromProcess()

  return (
    <html lang="ko" className={`${notoSansKR.variable} ${robotoMono.variable} bg-background`}>
      <body className="font-sans antialiased bg-background">
        {supabasePublicEnv ? (
          <script
            id="givecup-supabase-env"
            type="application/json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(supabasePublicEnv),
            }}
          />
        ) : null}
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
