import type { Metadata } from 'next'
import { Noto_Sans_KR, Roboto_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SupabaseProvider } from '@/components/supabase-provider'
import { readSupabasePublicEnvFromProcess } from '@/lib/supabase/public-env'
import './globals.css'

/** Vercel/빌드 시 env 없이 정적으로 굳는 것 방지 — 요청마다 Supabase 설정 주입 */
export const dynamic = 'force-dynamic'

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
  title: 'GiveCup: 2026 World Cup Edition · 기부컵',
  description:
    '2026 북중미 월드컵 한정판! 경기장 밖에서 펼쳐지는 기부 랭킹 대전. 당신의 국가와 집단을 1위로 만드세요.',
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
  const supabaseUrl = supabasePublicEnv?.url ?? ''
  const supabaseAnonKey = supabasePublicEnv?.anonKey ?? ''

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
        <SupabaseProvider url={supabaseUrl} anonKey={supabaseAnonKey}>
          {children}
        </SupabaseProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
