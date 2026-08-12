import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Maalove — Rencontres sérieuses & vérifiées',
  description: "Maalove : le site de rencontres sérieuses entre hommes européens et femmes africaines. Profils vérifiés, relations durables.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
