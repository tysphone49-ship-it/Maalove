import { Heart, ShieldCheck, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Qui sommes-nous',
  description: "La mission de Maalove : des rencontres sincères et vérifiées, dans un cadre sécurisé et bienveillant.",
}

export default function QuiSommesNousPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <header className="border-b border-rose-100/70 bg-white/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="inline-flex items-center" aria-label="Accueil Maalove">
            <img src="/logo.jpeg" alt="Maalove" className="h-9 w-auto object-contain rounded-md" />
          </a>
          <a href="/" className="text-sm font-medium px-4 py-2 rounded-md bg-rose-500 text-white hover:bg-rose-600 transition-colors">Se connecter</a>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 pt-14 pb-8 text-center">
        <div className="flex justify-center mb-6">
          <img src="/logo.jpeg" alt="Maalove" className="h-16 w-auto object-contain rounded-xl shadow-sm" />
        </div>
        <span className="inline-block text-xs font-semibold tracking-wide uppercase text-rose-500 bg-rose-50 border border-rose-100 rounded-full px-3 py-1 mb-4">Qui sommes-nous</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Des rencontres sincères, un accompagnement bienveillant</h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">Chez Maalove, nous croyons que l'amour véritable commence par une rencontre sincère.</p>
      </section>

      <section className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-rose-100 p-6 sm:p-8">
          <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
            Notre mission est de vous accompagner dans la recherche d'une relation <span className="text-rose-500 font-medium">authentique et durable</span>, en vous offrant un cadre sécurisé et convivial.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-10 grid gap-5 sm:grid-cols-3">
        <div className="bg-white rounded-2xl shadow-lg border border-rose-100 p-6">
          <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mb-4"><Heart className="h-6 w-6" /></div>
          <h3 className="font-semibold text-lg text-foreground mb-2">Notre mission</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">Vous accompagner vers une relation authentique et durable, dans un cadre sécurisé et convivial.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-rose-100 p-6">
          <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mb-4"><ShieldCheck className="h-6 w-6" /></div>
          <h3 className="font-semibold text-lg text-foreground mb-2">Votre sécurité</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">Nous comprenons vos préoccupations en ligne : chaque profil est vérifié avec rigueur pour écarter tout risque.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-rose-100 p-6">
          <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4"><Sparkles className="h-6 w-6" /></div>
          <h3 className="font-semibold text-lg text-foreground mb-2">Nos valeurs</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">Guidés par le respect et la bienveillance, nous vous aidons à écrire la plus belle page de votre histoire, en toute sérénité.</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-10">
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl shadow-xl p-8 text-center text-white">
          <Heart className="h-7 w-7 mx-auto mb-3 opacity-90" />
          <p className="text-lg sm:text-xl font-medium leading-relaxed">« Nous nous engageons à vous aider à écrire la plus belle page de votre histoire, en toute sérénité. »</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-16 text-center">
        <a href="/" className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-medium px-6 py-3 rounded-full shadow-lg transition-colors"><Heart className="h-5 w-5" /> Créer mon profil</a>
        <p className="mt-3 text-sm text-muted-foreground">Inscription rapide · profils vérifiés</p>
      </section>

      <footer className="border-t border-rose-100/70">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} Maalove · Des rencontres sincères et vérifiées</div>
      </footer>
    </div>
  )
}
