'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'
import { Slider } from '@/components/ui/slider'
import {
  Heart, ShieldCheck, Clock, MapPin, Send, Search, SlidersHorizontal, LogOut,
  MessageCircle, User, Users, Flag, Ban, CheckCircle2, XCircle, Sparkles,
  Globe, Briefcase, GraduationCap, Baby, Languages as LangIcon, ChevronRight, Menu, LayoutDashboard, LifeBuoy,
  FileText, Upload, CreditCard, Camera, X, Plus, Mail, Video
} from 'lucide-react'

const PAYS = ['France', 'Cameroun', 'Belgique', 'Suisse', 'Canada']
const LANGUES = ['Français', 'Anglais', 'Espagnol', 'Allemand']
const RELIGIONS = ['Chrétienne', 'Catholique', 'Musulmane', 'Non pratiquant', 'Autre']
const ENFANTS = ['Oui', 'Non']
const PROJET = ['Fonder une famille', 'Relation stable', "Ouverte à l'avenir"]
const SITUATIONS = ['Célibataire', 'Divorcé(e)', 'Veuf(ve)']
const ETUDES = ['Sans', 'Bac', 'Bac+2', 'Licence', 'Master', 'Doctorat', 'Formation pro']
const INTERETS = ['Cuisine', 'Voyages', 'Musique', 'Sport', 'Lecture', 'Danse', 'Cinéma', 'Mode', 'Nature', 'Art', 'Photographie', 'Tech']

const HERO_IMGS = [
  'https://images.unsplash.com/photo-1534470717-233b39a41c54?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1611432579402-7037e3e2c1e4?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1593351799227-75df2026356b?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1554727242-741c14fa561c?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1618298363483-e31a31f1a1e2?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1508002366005-75a695ee2d17?auto=format&fit=crop&w=500&q=80',
]

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function StatusBadge({ status }) {
  if (status === 'verifie') {
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1 border-0"><ShieldCheck className="h-3 w-3" /> Vérifié</Badge>
  }
  if (status === 'rejete') {
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 gap-1 border-0"><XCircle className="h-3 w-3" /> Rejeté</Badge>
  }
  if (status === 'en_verification') {
    return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1 border-0"><Clock className="h-3 w-3" /> En vérification</Badge>
  }
  if (status === 'documents_requis') {
    return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 gap-1 border-0"><Clock className="h-3 w-3" /> Documents requis</Badge>
  }
  return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1 border-0"><Clock className="h-3 w-3" /> En attente</Badge>
}

function Logo({ className = '', height = 'h-9' }) {
  return (
    <div className={`inline-flex items-center rounded-lg bg-black px-2.5 py-1 ${className}`}>
      <img src="/logo.jpeg" alt="Maalove" className={`${height} w-auto object-contain`} />
    </div>
  )
}

/* ---------------- NAVBAR ---------------- */
function Navbar({ me, view, setView, logout, unread, locked }) {
  const nav = (me && !locked) ? [
    { key: 'discover', label: 'Découvrir', icon: Search },
    { key: 'messages', label: 'Messages', icon: MessageCircle, badge: unread },
    { key: 'me', label: 'Mon profil', icon: User },
  ] : []
  return (
    <div className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <button onClick={() => setView(me ? 'discover' : 'landing')}><Logo /></button>
        <div className="flex items-center gap-1 sm:gap-2">
          {nav.map(n => (
            <Button key={n.key} variant={view === n.key ? 'default' : 'ghost'} size="sm"
              className={view === n.key ? 'bg-rose-500 hover:bg-rose-600 relative' : 'relative'}
              onClick={() => setView(n.key)}>
              <n.icon className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{n.label}</span>
              {n.badge ? <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center">{n.badge}</span> : null}
            </Button>
          ))}
          {me && ['admin', 'moderateur', 'support'].includes(me.role) && (
            <Button variant={view === 'admin' ? 'default' : 'ghost'} size="sm"
              className={view === 'admin' ? 'bg-slate-800 hover:bg-slate-900' : ''}
              onClick={() => setView('admin')}>
              <LayoutDashboard className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Admin</span>
            </Button>
          )}
          {me ? (
            <Button variant="ghost" size="sm" onClick={logout}><LogOut className="h-4 w-4" /></Button>
          ) : (
            <Button size="sm" className="bg-rose-500 hover:bg-rose-600" onClick={() => setView('auth')}>Se connecter</Button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------- LANDING ---------------- */
function Landing({ setView }) {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-amber-50" />
        <div className="container relative grid lg:grid-cols-2 gap-10 items-center py-16 lg:py-24">
          <div>
            <Badge className="bg-rose-100 text-rose-600 hover:bg-rose-100 border-0 mb-5 gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Profils vérifiés · Relations sérieuses
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
              L'amour vrai entre <span className="text-rose-500">deux continents</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-md">
              Maalove réunit des hommes européens et des femmes africaines qui recherchent une relation sincère et durable. Inscription en 1 minute, accès immédiat.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="bg-rose-500 hover:bg-rose-600 text-base" onClick={() => setView('auth')}>
                Créer mon profil gratuitement <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => setView('auth')}>J'ai déjà un compte</Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Identité vérifiée</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Gratuit à l'inscription</span>
            </div>
          </div>
          <div className="relative">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {HERO_IMGS.map((src, i) => (
                <div key={i} className={`rounded-2xl overflow-hidden shadow-lg border-4 border-white ${i % 2 === 1 ? 'sm:mt-6' : ''}`}>
                  <img src={src} alt="Femme africaine sur Maalove" loading="lazy" className="w-full h-36 sm:h-44 object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
            <div className="absolute -bottom-5 -left-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 -rotate-2">
              <div className="bg-emerald-100 rounded-full p-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /></div>
              <div><p className="text-sm font-semibold">Profils vérifiés</p><p className="text-xs text-muted-foreground">Femmes authentiques</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Sparkles, title: 'Inscription immédiate', desc: "Photo, prénom, âge, ville et c'est parti. Accès instantané au réseau." },
            { icon: ShieldCheck, title: 'Profils vérifiés', desc: 'Vérification email, téléphone et pièce d\u2019identité pour des rencontres sûres.' },
            { icon: Heart, title: 'Relations sérieuses', desc: 'Une communauté engagée dans la recherche de l\u2019amour durable.' },
          ].map((f, i) => (
            <Card key={i} className="border-rose-100/60">
              <CardContent className="pt-6">
                <div className="bg-rose-100 rounded-xl w-11 h-11 flex items-center justify-center mb-4"><f.icon className="h-5 w-5 text-rose-500" /></div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-rose-500 to-pink-500 py-16">
        <div className="container text-center text-white">
          <h2 className="text-3xl font-bold">Prêt à rencontrer quelqu'un de sincère ?</h2>
          <p className="mt-2 text-rose-50">Rejoignez Maalove aujourd'hui — pilote France ↔ Cameroun.</p>
          <Button size="lg" className="mt-6 bg-white text-rose-600 hover:bg-rose-50" onClick={() => setView('auth')}>Commencer maintenant</Button>
        </div>
      </section>
    </div>
  )
}

/* ---------------- AUTH ---------------- */
function AuthView({ onAuth, api }) {
  const [mode, setMode] = useState('register')
  const [loading, setLoading] = useState(false)
  const [reg, setReg] = useState({ prenom: '', email: '', password: '', genre: '', age: '', ville: '', pays: '', photo: '' })
  const [photoPreview, setPhotoPreview] = useState('')
  const [login, setLogin] = useState({ email: '', password: '' })

  const handlePhoto = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const b64 = await fileToBase64(f)
    setReg(r => ({ ...r, photo: b64 }))
    setPhotoPreview(b64)
  }

  const doRegister = async () => {
    if (!reg.prenom || !reg.email || !reg.password || !reg.genre) {
      toast.error('Prénom, email, mot de passe et genre sont requis'); return
    }
    setLoading(true)
    const res = await api('/auth/register', 'POST', reg)
    setLoading(false)
    if (res.error) { toast.error(res.error); return }
    if (res.user.genre === 'femme') toast.success('Profil créé ! Étape 2 : envoyez vos documents de vérification.')
    else toast.success('Profil créé ! Ajoutez une photo et un selfie pour accéder aux profils.')
    onAuth(res.token, res.user)
  }

  const doLogin = async () => {
    setLoading(true)
    const res = await api('/auth/login', 'POST', login)
    setLoading(false)
    if (res.error) { toast.error(res.error); return }
    toast.success('Connexion réussie')
    onAuth(res.token, res.user)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-rose-100">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2"><Logo height="h-12" /></div>
          <CardTitle>{mode === 'register' ? 'Créer votre profil' : 'Se connecter'}</CardTitle>
          <CardDescription>{mode === 'register' ? 'Inscription rapide · accès immédiat' : 'Ravis de vous revoir'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="register">Inscription</TabsTrigger>
              <TabsTrigger value="login">Connexion</TabsTrigger>
            </TabsList>

            <TabsContent value="register" className="space-y-3">
              <div className="flex flex-col items-center gap-2">
                <label className="cursor-pointer">
                  <Avatar className="h-20 w-20 border-2 border-rose-200">
                    {photoPreview ? <AvatarImage src={photoPreview} className="object-cover" /> : <AvatarFallback className="bg-rose-100 text-rose-400"><User className="h-8 w-8" /></AvatarFallback>}
                  </Avatar>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                </label>
                <span className="text-xs text-muted-foreground">Ajouter une photo</span>
              </div>
              <div><Label>Prénom</Label><Input value={reg.prenom} onChange={e => setReg({ ...reg, prenom: e.target.value })} placeholder="Votre prénom" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Genre</Label>
                  <Select value={reg.genre} onValueChange={v => setReg({ ...reg, genre: v, pays: v === 'femme' ? 'Cameroun' : 'France' })}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent><SelectItem value="homme">Homme</SelectItem><SelectItem value="femme">Femme</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Âge</Label><Input type="number" value={reg.age} onChange={e => setReg({ ...reg, age: e.target.value })} placeholder="Ex: 30" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Pays</Label>
                  <Select value={reg.pays} onValueChange={v => setReg({ ...reg, pays: v })}>
                    <SelectTrigger><SelectValue placeholder="Pays" /></SelectTrigger>
                    <SelectContent>{PAYS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Ville</Label><Input value={reg.ville} onChange={e => setReg({ ...reg, ville: e.target.value })} placeholder="Ville" /></div>
              </div>
              <div><Label>Email</Label><Input type="email" value={reg.email} onChange={e => setReg({ ...reg, email: e.target.value })} placeholder="vous@email.com" /></div>
              <div><Label>Mot de passe</Label><Input type="password" value={reg.password} onChange={e => setReg({ ...reg, password: e.target.value })} placeholder="••••••••" /></div>
              <Button className="w-full bg-rose-500 hover:bg-rose-600" onClick={doRegister} disabled={loading}>{loading ? 'Création...' : 'Créer mon profil'}</Button>
            </TabsContent>

            <TabsContent value="login" className="space-y-3">
              <div><Label>Email</Label><Input type="email" value={login.email} onChange={e => setLogin({ ...login, email: e.target.value })} placeholder="vous@email.com" /></div>
              <div><Label>Mot de passe</Label><Input type="password" value={login.password} onChange={e => setLogin({ ...login, password: e.target.value })} placeholder="••••••••" /></div>
              <Button className="w-full bg-rose-500 hover:bg-rose-600" onClick={doLogin} disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</Button>
              <p className="text-xs text-center text-muted-foreground">Démo admin : admin@maalove.com / admin123</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

/* ---------------- PROFILE CARD ---------------- */
function ProfileCard({ p, onClick }) {
  return (
    <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow border-rose-100/60" onClick={onClick}>
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {p.photo ? <img src={p.photo} alt={p.prenom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center bg-rose-50"><User className="h-16 w-16 text-rose-200" /></div>}
        <div className="absolute top-2 left-2"><StatusBadge status={p.status} /></div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{p.prenom}{p.age ? `, ${p.age}` : ''}</h3>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3.5 w-3.5" />{p.ville}, {p.pays}</p>
        {p.profession && <p className="text-sm mt-1 flex items-center gap-1 text-muted-foreground"><Briefcase className="h-3.5 w-3.5" />{p.profession}</p>}
        {p.interets?.length ? <div className="flex flex-wrap gap-1 mt-2">{p.interets.slice(0, 3).map(i => <Badge key={i} variant="secondary" className="text-xs font-normal">{i}</Badge>)}</div> : null}
      </CardContent>
    </Card>
  )
}

/* ---------------- DISCOVER ---------------- */
function Discover({ me, api, openProfile }) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ pays: '', langue: '', ageMin: 18, ageMax: 70, religion: '', profession: '', enfants: '', projetFamilial: '', verifie: false })

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (f.pays) params.set('pays', f.pays)
    if (f.langue) params.set('langue', f.langue)
    if (f.ageMin) params.set('ageMin', f.ageMin)
    if (f.ageMax) params.set('ageMax', f.ageMax)
    if (f.religion) params.set('religion', f.religion)
    if (f.profession) params.set('profession', f.profession)
    if (f.enfants) params.set('enfants', f.enfants)
    if (f.projetFamilial) params.set('projetFamilial', f.projetFamilial)
    if (f.verifie) params.set('verifie', 'true')
    const res = await api('/discover?' + params.toString(), 'GET')
    setProfiles(res.profiles || [])
    setLoading(false)
  }, [api, f])

  useEffect(() => { load() }, [])

  const reset = () => setF({ pays: '', langue: '', ageMin: 18, ageMax: 70, religion: '', profession: '', enfants: '', projetFamilial: '', verifie: false })

  return (
    <div className="container py-8">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Découvrir</h1>
          <p className="text-muted-foreground">Des {me?.genre === 'homme' ? 'femmes' : 'hommes'} qui cherchent une relation sérieuse</p>
        </div>
      </div>

      {/* Filtres principaux */}
      <Card className="mb-6 border-rose-100/60">
        <CardContent className="p-4">
          <div className="grid sm:grid-cols-4 gap-3 items-end">
            <div><Label className="text-xs">Pays</Label>
              <Select value={f.pays || 'all'} onValueChange={v => setF({ ...f, pays: v === 'all' ? '' : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Tous</SelectItem>{PAYS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Langue</Label>
              <Select value={f.langue || 'all'} onValueChange={v => setF({ ...f, langue: v === 'all' ? '' : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Toutes</SelectItem>{LANGUES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2"><Label className="text-xs">Âge : {f.ageMin} – {f.ageMax} ans</Label>
              <Slider min={18} max={80} step={1} value={[f.ageMin, f.ageMax]} onValueChange={([a, b]) => setF({ ...f, ageMin: a, ageMax: b })} className="mt-3" />
            </div>
          </div>

          <Collapsible open={open} onOpenChange={setOpen} className="mt-3">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-rose-600"><SlidersHorizontal className="h-4 w-4" /> Filtres avancés</Button>
              </CollapsibleTrigger>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={reset}>Réinitialiser</Button>
                <Button size="sm" className="bg-rose-500 hover:bg-rose-600" onClick={load}><Search className="h-4 w-4 mr-1" /> Rechercher</Button>
              </div>
            </div>
            <CollapsibleContent className="grid sm:grid-cols-4 gap-3 mt-3">
              <div><Label className="text-xs">Religion</Label>
                <Select value={f.religion || 'all'} onValueChange={v => setF({ ...f, religion: v === 'all' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Toutes</SelectItem>{RELIGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Enfants</Label>
                <Select value={f.enfants || 'all'} onValueChange={v => setF({ ...f, enfants: v === 'all' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Indifférent" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Indifférent</SelectItem>{ENFANTS.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Projet familial</Label>
                <Select value={f.projetFamilial || 'all'} onValueChange={v => setF({ ...f, projetFamilial: v === 'all' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Tous</SelectItem>{PROJET.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Profession</Label><Input value={f.profession} onChange={e => setF({ ...f, profession: e.target.value })} placeholder="Ex: infirmière" /></div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {loading ? <p className="text-center text-muted-foreground py-16">Chargement...</p>
        : profiles.length === 0 ? <p className="text-center text-muted-foreground py-16">Aucun profil ne correspond à vos critères.</p>
          : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {profiles.map(p => <ProfileCard key={p.id} p={p} onClick={() => openProfile(p.id)} />)}
          </div>}
    </div>
  )
}

/* ---------------- PROFILE DETAIL ---------------- */
function ProfileDetail({ profileId, api, back, startChat }) {
  const [p, setP] = useState(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')

  useEffect(() => { (async () => { const r = await api('/users/' + profileId, 'GET'); setP(r.profile) })() }, [profileId])

  if (!p) return <p className="text-center py-16 text-muted-foreground">Chargement...</p>

  const block = async () => { await api('/block', 'POST', { blockedId: p.id }); toast.success('Utilisateur bloqué'); back() }
  const report = async () => {
    if (!reason) { toast.error('Sélectionnez un motif'); return }
    await api('/report', 'POST', { reportedId: p.id, reason, details }); setReportOpen(false); toast.success('Signalement envoyé à la modération')
  }

  const Info = ({ icon: Icon, label, value }) => value ? (
    <div className="flex items-start gap-2 text-sm"><Icon className="h-4 w-4 text-rose-500 mt-0.5" /><span className="text-muted-foreground">{label} :</span><span className="font-medium">{value}</span></div>
  ) : null

  return (
    <div className="container py-8 max-w-4xl">
      <Button variant="ghost" onClick={back} className="mb-4">← Retour</Button>
      <div className="grid md:grid-cols-2 gap-6">
        {(() => {
          const gallery = (p.photos && p.photos.length ? p.photos : (p.photo ? [p.photo] : []))
          if (!gallery.length) return (
            <div className="rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-rose-50 aspect-[4/5] flex items-center justify-center"><User className="h-20 w-20 text-rose-200" /></div>
          )
          return (
            <Carousel className="w-full">
              <CarouselContent>
                {gallery.map((src, i) => (
                  <CarouselItem key={i}>
                    <div className="relative rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-muted aspect-[4/5]">
                      <img src={src} alt={`${p.prenom} ${i + 1}`} className="w-full h-full object-cover" />
                      {gallery.length > 1 && <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">{i + 1}/{gallery.length}</span>}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {gallery.length > 1 && <><CarouselPrevious className="left-2" /><CarouselNext className="right-2" /></>}
            </Carousel>
          )
        })()}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{p.prenom}{p.age ? `, ${p.age}` : ''}</h1>
            <StatusBadge status={p.status} />
          </div>
          <p className="text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-4 w-4" />{p.ville}, {p.pays}</p>
          {p.description && <p className="mt-4 text-sm leading-relaxed bg-rose-50/60 rounded-lg p-3">{p.description}</p>}
          <div className="mt-4 space-y-2">
            <Info icon={Briefcase} label="Profession" value={p.profession} />
            <Info icon={LangIcon} label="Langues" value={p.langues?.join(', ')} />
            <Info icon={GraduationCap} label="Études" value={p.etudes} />
            <Info icon={Users} label="Situation" value={p.situationFamiliale} />
            <Info icon={Baby} label="Enfants" value={p.enfants} />
            <Info icon={Globe} label="Religion" value={p.religion} />
            <Info icon={Heart} label="Projet" value={p.projetFamilial} />
          </div>
          {p.interets?.length ? <div className="flex flex-wrap gap-1.5 mt-4">{p.interets.map(i => <Badge key={i} variant="secondary">{i}</Badge>)}</div> : null}
          <div className="flex gap-2 mt-6">
            <Button className="bg-rose-500 hover:bg-rose-600 flex-1" onClick={() => startChat(p)}><Send className="h-4 w-4 mr-1" /> Envoyer un message</Button>
            <Button variant="outline" size="icon" onClick={block} title="Bloquer"><Ban className="h-4 w-4" /></Button>
            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
              <DialogTrigger asChild><Button variant="outline" size="icon" title="Signaler"><Flag className="h-4 w-4" /></Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Signaler {p.prenom}</DialogTitle><DialogDescription>Votre signalement est transmis à l'équipe de modération.</DialogDescription></DialogHeader>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger><SelectValue placeholder="Motif du signalement" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Faux profil">Faux profil</SelectItem>
                    <SelectItem value="Contenu inapproprié">Contenu inapproprié</SelectItem>
                    <SelectItem value="Arnaque / argent">Arnaque / argent</SelectItem>
                    <SelectItem value="Comportement irrespectueux">Comportement irrespectueux</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="Détails (facultatif)" value={details} onChange={e => setDetails(e.target.value)} />
                <DialogFooter><Button className="bg-rose-500 hover:bg-rose-600" onClick={report}>Envoyer le signalement</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- MESSAGES ---------------- */
function Messages({ me, api, activeChat, setActiveChat }) {
  const [convs, setConvs] = useState([])
  const [msgs, setMsgs] = useState([])
  const [other, setOther] = useState(activeChat || null)
  const [text, setText] = useState('')
  const scrollRef = useRef(null)

  const loadConvs = useCallback(async () => { const r = await api('/conversations', 'GET'); setConvs(r.conversations || []) }, [api])
  const loadMsgs = useCallback(async (id) => { const r = await api('/messages/' + id, 'GET'); setMsgs(r.messages || []); if (r.otherUser) setOther(r.otherUser) }, [api])

  useEffect(() => { loadConvs() }, [])
  useEffect(() => { if (other?.id) loadMsgs(other.id) }, [other?.id])
  useEffect(() => { if (!other?.id) return; const t = setInterval(() => loadMsgs(other.id), 4000); return () => clearInterval(t) }, [other?.id])
  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight) }, [msgs])

  const send = async () => {
    if (!text.trim() || !other) return
    const res = await api('/messages', 'POST', { receiverId: other.id, text: text.trim() })
    if (res.error) { toast.error(res.error); return }
    setText(''); loadMsgs(other.id); loadConvs()
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      <div className="grid md:grid-cols-3 gap-4 h-[70vh]">
        <Card className="overflow-hidden md:col-span-1 flex flex-col">
          <CardHeader className="py-3 border-b"><CardTitle className="text-base">Conversations</CardTitle></CardHeader>
          <div className="overflow-y-auto flex-1">
            {convs.length === 0 && <p className="text-sm text-muted-foreground p-4">Aucune conversation. Contactez un profil depuis Découvrir.</p>}
            {convs.map(c => (
              <button key={c.otherId} onClick={() => setOther(c.user)} className={`w-full flex items-center gap-3 p-3 hover:bg-muted text-left ${other?.id === c.otherId ? 'bg-rose-50' : ''}`}>
                <Avatar className="h-10 w-10"><AvatarImage src={c.user?.photo} className="object-cover" /><AvatarFallback>{c.user?.prenom?.[0]}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{c.user?.prenom}</p><p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p></div>
                {c.unread > 0 && <span className="bg-rose-500 text-white text-[10px] rounded-full h-5 min-w-5 px-1 flex items-center justify-center">{c.unread}</span>}
              </button>
            ))}
          </div>
        </Card>

        <Card className="md:col-span-2 flex flex-col overflow-hidden">
          {!other ? <div className="flex-1 flex items-center justify-center text-muted-foreground"><div className="text-center"><MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />Sélectionnez une conversation</div></div>
            : <>
              <CardHeader className="py-3 border-b flex-row items-center gap-3 space-y-0">
                <Avatar className="h-9 w-9"><AvatarImage src={other.photo} className="object-cover" /><AvatarFallback>{other.prenom?.[0]}</AvatarFallback></Avatar>
                <div><CardTitle className="text-base flex items-center gap-2">{other.prenom} <StatusBadge status={other.status} /></CardTitle></div>
              </CardHeader>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-rose-50/30">
                {msgs.map(m => (
                  <div key={m.id} className={`flex ${m.senderId === me.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.senderId === me.id ? 'bg-rose-500 text-white rounded-br-sm' : 'bg-white border rounded-bl-sm'}`}>{m.text}</div>
                  </div>
                ))}
                {msgs.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Dites bonjour à {other.prenom} 👋</p>}
              </div>
              <div className="p-3 border-t flex gap-2">
                <Input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Votre message..." />
                <Button className="bg-rose-500 hover:bg-rose-600" onClick={send}><Send className="h-4 w-4" /></Button>
              </div>
            </>}
        </Card>
      </div>
    </div>
  )
}

/* ---------------- MY PROFILE ---------------- */
function MyProfile({ me, api, refreshMe }) {
  const [p, setP] = useState(me)
  const [saving, setSaving] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [otpPhone, setOtpPhone] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [phoneCode, setPhoneCode] = useState('')

  useEffect(() => { setP(me) }, [me])

  const toggleInteret = (i) => setP(prev => ({ ...prev, interets: prev.interets?.includes(i) ? prev.interets.filter(x => x !== i) : [...(prev.interets || []), i] }))
  const toggleLangue = (l) => setP(prev => ({ ...prev, langues: prev.langues?.includes(l) ? prev.langues.filter(x => x !== l) : [...(prev.langues || []), l] }))

  const save = async () => {
    setSaving(true)
    const res = await api('/profile', 'PUT', p)
    setSaving(false)
    if (res.error) { toast.error(res.error); return }
    toast.success('Profil mis à jour'); refreshMe()
  }

  const sendOtp = async (type) => {
    const res = await api('/otp/send', 'POST', { type })
    if (res.code) { type === 'email' ? setOtpEmail(res.code) : setOtpPhone(res.code); toast.info(`Code (démo) : ${res.code}`) }
  }
  const verifyOtp = async (type) => {
    const code = type === 'email' ? emailCode : phoneCode
    const res = await api('/otp/verify', 'POST', { type, code })
    if (res.error) { toast.error(res.error); return }
    toast.success('Vérifié !'); refreshMe()
  }

  const handlePhoto = async (e) => { const f = e.target.files?.[0]; if (!f) return; const b64 = await fileToBase64(f); setP({ ...p, photo: b64 }) }

  const photosArr = (p?.photos && p.photos.length ? p.photos : (p?.photo ? [p.photo] : []))
  const addPhoto = async (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const cur = (p?.photos && p.photos.length ? p.photos : (p?.photo ? [p.photo] : []))
    if (cur.length >= 4) { toast.error('4 photos maximum'); return }
    const b64 = await fileToBase64(f)
    const next = [...cur, b64]
    setP({ ...p, photos: next, photo: next[0] })
  }
  const removePhoto = (i) => {
    const cur = (p?.photos && p.photos.length ? p.photos : (p?.photo ? [p.photo] : []))
    const next = cur.filter((_, idx) => idx !== i)
    setP({ ...p, photos: next, photo: next[0] || '' })
  }

  const completion = (() => {
    const fields = ['photo', 'profession', 'description', 'etudes', 'situationFamiliale', 'religion', 'projetFamilial']
    const done = fields.filter(k => p?.[k]).length + (p?.interets?.length ? 1 : 0) + (p?.langues?.length ? 1 : 0)
    return Math.round((done / (fields.length + 2)) * 100)
  })()

  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-1">Mon profil</h1>
      <p className="text-muted-foreground mb-6">Complétez votre profil pour de meilleures rencontres</p>

      {me?.genre === 'femme' && me?.status === 'verifie' && !me?.description && (
        <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
          <div><p className="font-semibold text-emerald-800">Compte validé 🎉</p><p className="text-sm text-emerald-700">Bienvenue {me.prenom} ! Poursuivez votre inscription : ajoutez jusqu'à 4 photos et complétez votre profil pour devenir visible auprès des membres.</p></div>
        </div>
      )}

      {/* Vérification */}
      <Card className="mb-6 border-rose-100/60">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-rose-500" /> Vérification</CardTitle>
          <CardDescription>Statut du compte : <StatusBadge status={p?.status} /></CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {p?.status === 'en_attente' && <div className="text-sm bg-amber-50 text-amber-800 rounded-lg p-3">Votre pièce d'identité sera vérifiée manuellement par notre équipe. Vous obtiendrez le badge « Vérifié » une fois validée.</div>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border rounded-lg p-3">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">Email {p?.emailVerified ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Clock className="h-4 w-4 text-amber-500" />}</p>
              {!p?.emailVerified && <div className="flex gap-2">
                {!otpEmail ? <Button size="sm" variant="outline" onClick={() => sendOtp('email')}>Envoyer le code</Button>
                  : <><Input className="h-9" value={emailCode} onChange={e => setEmailCode(e.target.value)} placeholder="Code à 6 chiffres" /><Button size="sm" className="bg-rose-500 hover:bg-rose-600" onClick={() => verifyOtp('email')}>Vérifier</Button></>}
              </div>}
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">Téléphone {p?.phoneVerified ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Clock className="h-4 w-4 text-amber-500" />}</p>
              {!p?.phoneVerified && <div className="flex gap-2">
                {!otpPhone ? <Button size="sm" variant="outline" onClick={() => sendOtp('phone')}>Envoyer le code</Button>
                  : <><Input className="h-9" value={phoneCode} onChange={e => setPhoneCode(e.target.value)} placeholder="Code à 6 chiffres" /><Button size="sm" className="bg-rose-500 hover:bg-rose-600" onClick={() => verifyOtp('phone')}>Vérifier</Button></>}
              </div>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progression */}
      <Card className="mb-6 border-rose-100/60">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">Profil complété</span><span className="text-sm font-bold text-rose-500">{completion}%</span></div>
          <div className="h-2 bg-rose-100 rounded-full overflow-hidden"><div className="h-full bg-rose-500 transition-all" style={{ width: completion + '%' }} /></div>
        </CardContent>
      </Card>

      {/* Édition */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Mes photos (jusqu'à 4)</Label>
            <div className="grid grid-cols-4 gap-3 mt-2">
              {[0, 1, 2, 3].map(i => {
                const src = photosArr[i]
                return (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-rose-200 bg-rose-50/40 flex items-center justify-center">
                    {src ? (
                      <>
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        {i === 0 && <span className="absolute top-1 left-1 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded">Principale</span>}
                        <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"><X className="h-3 w-3" /></button>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center text-rose-400">
                        <Plus className="h-6 w-6" />
                        <span className="text-[11px] mt-1">Ajouter</span>
                        <input type="file" accept="image/*" className="hidden" onChange={addPhoto} />
                      </label>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">La première photo est votre photo principale.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Prénom</Label><Input value={p?.prenom || ''} onChange={e => setP({ ...p, prenom: e.target.value })} /></div>
            <div><Label>Âge</Label><Input type="number" value={p?.age || ''} onChange={e => setP({ ...p, age: e.target.value })} /></div>
            <div><Label>Ville</Label><Input value={p?.ville || ''} onChange={e => setP({ ...p, ville: e.target.value })} /></div>
            <div><Label>Pays</Label>
              <Select value={p?.pays || ''} onValueChange={v => setP({ ...p, pays: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAYS.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label>Profession</Label><Input value={p?.profession || ''} onChange={e => setP({ ...p, profession: e.target.value })} /></div>
            <div><Label>Études</Label>
              <Select value={p?.etudes || ''} onValueChange={v => setP({ ...p, etudes: v })}><SelectTrigger><SelectValue placeholder="Niveau" /></SelectTrigger><SelectContent>{ETUDES.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label>Situation familiale</Label>
              <Select value={p?.situationFamiliale || ''} onValueChange={v => setP({ ...p, situationFamiliale: v })}><SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger><SelectContent>{SITUATIONS.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label>Enfants</Label>
              <Select value={p?.enfants || ''} onValueChange={v => setP({ ...p, enfants: v })}><SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger><SelectContent>{ENFANTS.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label>Religion</Label>
              <Select value={p?.religion || ''} onValueChange={v => setP({ ...p, religion: v })}><SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger><SelectContent>{RELIGIONS.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label>Projet familial</Label>
              <Select value={p?.projetFamilial || ''} onValueChange={v => setP({ ...p, projetFamilial: v })}><SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger><SelectContent>{PROJET.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <div><Label>Langues parlées</Label>
            <div className="flex flex-wrap gap-2 mt-2">{LANGUES.map(l => <Badge key={l} onClick={() => toggleLangue(l)} className={`cursor-pointer ${p?.langues?.includes(l) ? 'bg-rose-500 hover:bg-rose-600' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>{l}</Badge>)}</div>
          </div>
          <div><Label>Centres d'intérêt</Label>
            <div className="flex flex-wrap gap-2 mt-2">{INTERETS.map(i => <Badge key={i} onClick={() => toggleInteret(i)} className={`cursor-pointer ${p?.interets?.includes(i) ? 'bg-rose-500 hover:bg-rose-600' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>{i}</Badge>)}</div>
          </div>
          <div><Label>Description</Label><Textarea rows={4} value={p?.description || ''} onChange={e => setP({ ...p, description: e.target.value })} placeholder="Présentez-vous en quelques mots..." /></div>
          <Button className="bg-rose-500 hover:bg-rose-600 w-full" onClick={save} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer mon profil'}</Button>
        </CardContent>
      </Card>
    </div>
  )
}

/* ---------------- ADMIN ---------------- */
function VerifDetailDialog({ u, decide }) {
  const [open, setOpen] = useState(false)
  const gallery = u.photos && u.photos.length ? u.photos : (u.photo ? [u.photo] : [])
  const act = (d) => { decide(u.id, d); setOpen(false) }
  const Row = ({ label, value }) => value ? (
    <div className="flex justify-between gap-4 py-1.5 border-b border-border/50 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  ) : null
  const Section = ({ title, children }) => (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-rose-500 mb-1">{title}</p>
      {children}
    </div>
  )
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline" className="h-8"><Search className="h-3.5 w-3.5 mr-1" /> Dossier complet</Button></DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">{u.prenom}{u.age ? `, ${u.age}` : ''} <StatusBadge status={u.status} /></DialogTitle>
          <DialogDescription>Dossier de validation — {u.genre} · {u.ville}, {u.pays}</DialogDescription>
        </DialogHeader>

        {gallery.length > 0 && (
          <Section title="Photos">
            <div className="flex gap-2 flex-wrap">
              {gallery.map((src, i) => <a key={i} href={src} target="_blank" rel="noreferrer"><img src={src} alt="" className="h-28 w-24 object-cover rounded-lg border" /></a>)}
            </div>
          </Section>
        )}

        <Section title="Identité & compte">
          <Row label="Email" value={u.email} />
          <Row label="Téléphone" value={u.phone} />
          <Row label="Email vérifié" value={u.emailVerified ? 'Oui' : 'Non'} />
          <Row label="Téléphone vérifié" value={u.phoneVerified ? 'Oui' : 'Non'} />
          <Row label="Genre" value={u.genre} />
          <Row label="Âge" value={u.age} />
          <Row label="Ville" value={u.ville} />
          <Row label="Pays" value={u.pays} />
          <Row label="Inscrit le" value={u.createdAt ? new Date(u.createdAt).toLocaleString('fr-FR') : ''} />
        </Section>

        <Section title="Profil">
          <Row label="Profession" value={u.profession} />
          <Row label="Études" value={u.etudes} />
          <Row label="Situation familiale" value={u.situationFamiliale} />
          <Row label="Enfants" value={u.enfants} />
          <Row label="Religion" value={u.religion} />
          <Row label="Projet familial" value={u.projetFamilial} />
          <Row label="Langues" value={u.langues?.join(', ')} />
          <Row label="Centres d'intérêt" value={u.interets?.join(', ')} />
          {u.description && <p className="text-sm mt-2 bg-muted/50 rounded-lg p-2">« {u.description} »</p>}
        </Section>

        {u.genre === 'femme' && (u.pieceIdentite || u.preuvePaiement || u.videoPresentation) && (
          <Section title="Vérification (documents)">
            <div className="flex gap-3 flex-wrap">
              {u.pieceIdentite && <a href={u.pieceIdentite} target="_blank" rel="noreferrer" className="block"><img src={u.pieceIdentite} alt="" className="h-28 w-40 object-cover rounded border" /><span className="text-[11px] text-muted-foreground">Pièce d'identité</span></a>}
              {u.preuvePaiement && <a href={u.preuvePaiement} target="_blank" rel="noreferrer" className="block"><img src={u.preuvePaiement} alt="" className="h-28 w-40 object-cover rounded border" /><span className="text-[11px] text-muted-foreground">Preuve paiement</span></a>}
            </div>
            {(u.moyenPaiement || u.referencePaiement) && <p className="text-sm mt-2"><b>{u.moyenPaiement}</b>{u.referencePaiement ? ` · Réf: ${u.referencePaiement}` : ''}</p>}
            {u.videoPresentation && (
              <div className="mt-3">
                <p className="text-xs font-medium flex items-center gap-1 mb-1"><Video className="h-3.5 w-3.5" /> Vidéo de présentation</p>
                <video src={u.videoPresentation} controls className="w-full max-w-sm rounded border bg-black" />
                {u.phraseVideo && <p className="text-[11px] text-muted-foreground mt-1">Phrase attendue : « {u.phraseVideo} »</p>}
              </div>
            )}
          </Section>
        )}

        {u.genre === 'homme' && u.selfie && (
          <Section title="Vérification (selfie)">
            <a href={u.selfie} target="_blank" rel="noreferrer"><img src={u.selfie} alt="selfie" className="h-40 w-auto rounded border" /></a>
            <p className="text-[11px] text-muted-foreground mt-1">Selfie fourni pour comparaison avec la photo de profil.</p>
          </Section>
        )}

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" className="text-red-600" onClick={() => act('rejete')}><XCircle className="h-4 w-4 mr-1" /> Rejeter</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => act('verifie')}><CheckCircle2 className="h-4 w-4 mr-1" /> Valider</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Admin({ me, api }) {
  const [stats, setStats] = useState(null)
  const [verifs, setVerifs] = useState([])
  const [reports, setReports] = useState([])
  const [users, setUsers] = useState([])
  const [tickets, setTickets] = useState([])
  const [notifs, setNotifs] = useState([])
  const [notifEmail, setNotifEmail] = useState('')
  const [notifUnread, setNotifUnread] = useState(0)

  const loadAll = useCallback(async () => {
    const [s, v, r, u, t, n] = await Promise.all([
      api('/admin/stats', 'GET'), api('/admin/verifications', 'GET'), api('/admin/reports', 'GET'), api('/admin/users', 'GET'), api('/admin/tickets', 'GET'), api('/admin/notifications', 'GET'),
    ])
    setStats(s.stats); setVerifs(v.users || []); setReports(r.reports || []); setUsers(u.users || []); setTickets(t.tickets || [])
    setNotifs(n.notifications || []); setNotifEmail(n.email || ''); setNotifUnread(n.unread || 0)
  }, [api])

  const markRead = async () => { await api('/admin/notifications/read', 'POST', {}); loadAll() }

  useEffect(() => { loadAll() }, [])

  const decide = async (userId, decision) => { await api('/admin/verify', 'POST', { userId, decision }); toast.success(decision === 'verifie' ? 'Profil vérifié' : 'Profil rejeté'); loadAll() }
  const resolveReport = async (reportId) => { await api('/admin/reports/resolve', 'POST', { reportId, status: 'resolu' }); toast.success('Signalement traité'); loadAll() }
  const resolveTicket = async (ticketId) => { await api('/admin/tickets/resolve', 'POST', { ticketId }); toast.success('Ticket résolu'); loadAll() }

  const role = me.role
  const canVerif = ['admin', 'moderateur'].includes(role)
  const canSupport = ['admin', 'support'].includes(role)

  const Stat = ({ label, value, color }) => (
    <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{label}</p><p className={`text-3xl font-bold ${color || ''}`}>{value ?? '—'}</p></CardContent></Card>
  )

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-3xl font-bold flex items-center gap-2"><LayoutDashboard className="h-7 w-7 text-rose-500" /> Administration</h1>
          <p className="text-muted-foreground">Rôle : <Badge variant="secondary" className="capitalize">{role}</Badge></p></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="Utilisateurs" value={stats?.totalUsers} />
        <Stat label="Vérifiés" value={stats?.verifies} color="text-emerald-600" />
        <Stat label="En attente" value={stats?.enAttente} color="text-amber-600" />
        <Stat label="Messages" value={stats?.messages} />
        <Stat label="Femmes" value={stats?.femmes} color="text-rose-500" />
        <Stat label="Hommes" value={stats?.hommes} color="text-blue-500" />
        <Stat label="Signalements" value={stats?.signalements} color="text-red-600" />
        <Stat label="Tickets" value={stats?.tickets} color="text-purple-600" />
      </div>

      <Tabs defaultValue={canVerif ? 'verifs' : 'tickets'}>
        <TabsList>
          {canVerif && <TabsTrigger value="verifs">Vérifications ({verifs.length})</TabsTrigger>}
          {canVerif && <TabsTrigger value="reports">Signalements ({reports.filter(r => r.status === 'ouvert').length})</TabsTrigger>}
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="activite">Activité{notifUnread ? ` (${notifUnread})` : ''}</TabsTrigger>
          {canSupport && <TabsTrigger value="tickets">Support ({tickets.filter(t => t.status === 'ouvert').length})</TabsTrigger>}
        </TabsList>

        {canVerif && <TabsContent value="verifs" className="mt-4">
          {verifs.length === 0 ? <p className="text-muted-foreground py-8 text-center">Aucune vérification en attente 🎉</p>
            : <div className="grid sm:grid-cols-2 gap-4">{verifs.map(u => (
              <Card key={u.id}><CardContent className="pt-6">
                <div className="flex gap-3">
                  <Avatar className="h-14 w-14"><AvatarImage src={u.photo} className="object-cover" /><AvatarFallback>{u.prenom?.[0]}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <p className="font-semibold flex items-center gap-2">{u.prenom}, {u.age} <StatusBadge status={u.status} /></p>
                    <p className="text-xs text-muted-foreground">{u.ville}, {u.pays} · {u.genre}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                {(u.pieceIdentite || u.preuvePaiement || u.referencePaiement) && (
                  <div className="mt-3 rounded-lg bg-muted/50 p-3">
                    <p className="text-xs font-medium mb-2">Dossier de vérification</p>
                    <div className="flex gap-3">
                      {u.pieceIdentite && <a href={u.pieceIdentite} target="_blank" rel="noreferrer" className="block"><img src={u.pieceIdentite} alt="Pièce" className="h-20 w-28 object-cover rounded border" /><span className="text-[11px] text-muted-foreground">Pièce d'identité</span></a>}
                      {u.preuvePaiement && <a href={u.preuvePaiement} target="_blank" rel="noreferrer" className="block"><img src={u.preuvePaiement} alt="Paiement" className="h-20 w-28 object-cover rounded border" /><span className="text-[11px] text-muted-foreground">Preuve paiement</span></a>}
                    </div>
                    {(u.moyenPaiement || u.referencePaiement) && <p className="text-xs mt-2"><b>{u.moyenPaiement}</b>{u.referencePaiement ? ` · Réf: ${u.referencePaiement}` : ''}</p>}
                    {u.videoPresentation && (
                      <div className="mt-3">
                        <p className="text-xs font-medium flex items-center gap-1 mb-1"><Video className="h-3.5 w-3.5" /> Vidéo de présentation</p>
                        <video src={u.videoPresentation} controls className="w-full max-w-xs rounded border bg-black" />
                        {u.phraseVideo && <p className="text-[11px] text-muted-foreground mt-1">Phrase attendue : « {u.phraseVideo} »</p>}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2 mt-3 flex-wrap">
                  <VerifDetailDialog u={u} decide={decide} />
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8" onClick={() => decide(u.id, 'verifie')}><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Valider</Button>
                  <Button size="sm" variant="outline" className="h-8 text-red-600" onClick={() => decide(u.id, 'rejete')}><XCircle className="h-3.5 w-3.5 mr-1" /> Rejeter</Button>
                </div>
              </CardContent></Card>
            ))}</div>}
        </TabsContent>}

        {canVerif && <TabsContent value="reports" className="mt-4">
          {reports.length === 0 ? <p className="text-muted-foreground py-8 text-center">Aucun signalement</p>
            : <div className="space-y-3">{reports.map(r => (
              <Card key={r.id}><CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-medium flex items-center gap-2"><Flag className="h-4 w-4 text-red-500" /> {r.reason} {r.status === 'resolu' && <Badge className="bg-emerald-100 text-emerald-700 border-0">Résolu</Badge>}</p>
                  <p className="text-sm text-muted-foreground">Profil signalé : <b>{r.reported?.prenom || '—'}</b> · par {r.reporter?.prenom || '—'}</p>
                  {r.details && <p className="text-sm mt-1">« {r.details} »</p>}
                </div>
                {r.status === 'ouvert' && <Button size="sm" variant="outline" onClick={() => resolveReport(r.id)}>Marquer traité</Button>}
              </CardContent></Card>
            ))}</div>}
        </TabsContent>}

        <TabsContent value="users" className="mt-4">
          <Card><CardContent className="pt-4 divide-y">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 py-2">
                <Avatar className="h-9 w-9"><AvatarImage src={u.photo} className="object-cover" /><AvatarFallback>{u.prenom?.[0]}</AvatarFallback></Avatar>
                <div className="flex-1"><p className="text-sm font-medium">{u.prenom}, {u.age}</p><p className="text-xs text-muted-foreground">{u.ville}, {u.pays} · {u.email}</p></div>
                <StatusBadge status={u.status} />
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="activite" className="mt-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Mail className="h-4 w-4" /> Notifications envoyées à <b>{notifEmail || 'maalove237@gmail.com'}</b> <Badge variant="secondary" className="ml-1">email SIMULÉ</Badge></p>
            {notifUnread > 0 && <Button size="sm" variant="outline" onClick={markRead}>Tout marquer comme lu ({notifUnread})</Button>}
          </div>
          {notifs.length === 0 ? <p className="text-muted-foreground py-8 text-center">Aucune activité pour le moment</p>
            : <div className="space-y-2">{notifs.map(n => (
              <Card key={n.id} className={n.read ? '' : 'border-rose-200 bg-rose-50/40'}>
                <CardContent className="py-3 flex items-center gap-3">
                  <div className="bg-rose-100 rounded-full p-2"><Sparkles className="h-4 w-4 text-rose-500" /></div>
                  <div className="flex-1"><p className="text-sm font-medium">{n.type}</p><p className="text-sm text-muted-foreground">{n.message}</p></div>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />}
                </CardContent>
              </Card>
            ))}</div>}
        </TabsContent>

        {canSupport && <TabsContent value="tickets" className="mt-4">
          {tickets.length === 0 ? <p className="text-muted-foreground py-8 text-center">Aucun ticket de support</p>
            : <div className="space-y-3">{tickets.map(t => (
              <Card key={t.id}><CardContent className="py-4 flex items-center justify-between gap-4">
                <div><p className="font-medium flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-purple-500" /> {t.sujet}</p>
                  <p className="text-sm text-muted-foreground">{t.user?.prenom} · {t.user?.email}</p><p className="text-sm mt-1">{t.message}</p></div>
                {t.status === 'ouvert' && <Button size="sm" variant="outline" onClick={() => resolveTicket(t.id)}>Résoudre</Button>}
              </CardContent></Card>
            ))}</div>}
        </TabsContent>}
      </Tabs>
    </div>
  )
}

/* ---------------- DOCUMENTS STEP (femmes) ---------------- */
function genPhrase(prenom) {
  const code = Math.floor(1000 + Math.random() * 9000)
  return `Bonjour, je m'appelle ${prenom || '...'}. Je rejoins Maalove pour une relation sérieuse. Mon code de vérification est ${code}.`
}

function VideoRecorder({ phrase, onRecorded }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const [status, setStatus] = useState('idle')
  const [seconds, setSeconds] = useState(0)
  const [previewUrl, setPreviewUrl] = useState('')

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, facingMode: 'user' }, audio: true })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.muted = true; await videoRef.current.play() }
      setStatus('ready')
    } catch (e) { toast.error("Caméra/micro inaccessible. Autorisez l'accès dans le navigateur.") }
  }

  const startRec = () => {
    if (!streamRef.current) return
    chunksRef.current = []
    let mime = 'video/webm;codecs=vp8,opus'
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported(mime)) mime = 'video/webm'
    let rec
    try { rec = new MediaRecorder(streamRef.current, { mimeType: mime, videoBitsPerSecond: 400000 }) }
    catch (e) { rec = new MediaRecorder(streamRef.current) }
    rec.ondataavailable = e => { if (e.data && e.data.size) chunksRef.current.push(e.data) }
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setPreviewUrl(URL.createObjectURL(blob))
      const reader = new FileReader(); reader.onload = () => onRecorded(reader.result); reader.readAsDataURL(blob)
      setStatus('recorded')
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
    recorderRef.current = rec
    rec.start(); setStatus('recording'); setSeconds(0)
  }

  useEffect(() => {
    if (status !== 'recording') return
    const t = setInterval(() => setSeconds(s => {
      const n = s + 1
      if (n >= 15) { try { recorderRef.current?.state !== 'inactive' && recorderRef.current?.stop() } catch (e) {} }
      return n
    }), 1000)
    return () => clearInterval(t)
  }, [status])

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])

  const reset = async () => { setPreviewUrl(''); onRecorded(''); setStatus('idle'); setSeconds(0); await startCamera() }

  return (
    <div>
      <span className="text-sm font-medium">Vidéo de présentation (contrôle de sécurité)</span>
      <div className="mt-1 rounded-xl border p-3">
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-center mb-3">
          <p className="text-xs text-rose-600 font-medium mb-1">Regardez la caméra et lisez cette phrase à voix haute :</p>
          <p className="text-sm font-semibold">« {phrase} »</p>
        </div>
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          {status === 'recorded' && previewUrl
            ? <video src={previewUrl} controls className="w-full h-full object-contain bg-black" />
            : <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />}
          {status === 'idle' && <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm"><Video className="h-6 w-6 mr-2" /> Caméra désactivée</div>}
          {status === 'recording' && <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-white animate-pulse" /> REC {seconds}s / 15s</span>}
        </div>
        <div className="flex gap-2 mt-3 flex-wrap items-center">
          {status === 'idle' && <Button type="button" variant="outline" onClick={startCamera}><Video className="h-4 w-4 mr-1" /> Activer la caméra</Button>}
          {status === 'ready' && <Button type="button" className="bg-rose-500 hover:bg-rose-600" onClick={startRec}><span className="h-2 w-2 rounded-full bg-white mr-2" /> Démarrer l'enregistrement</Button>}
          {status === 'recording' && <Button type="button" variant="destructive" onClick={() => { try { recorderRef.current?.stop() } catch (e) {} }}>Arrêter</Button>}
          {status === 'recorded' && <><span className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Vidéo enregistrée</span><Button type="button" variant="ghost" size="sm" onClick={reset}>Refaire</Button></>}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Maximum 15 secondes. Cette vidéo confirme que vous êtes une personne réelle.</p>
      </div>
    </div>
  )
}

function DocumentsStep({ me, api, refreshMe, logout }) {
  const [piece, setPiece] = useState('')
  const [preuve, setPreuve] = useState('')
  const [moyen, setMoyen] = useState('')
  const [ref, setRef] = useState('')
  const [phrase] = useState(() => genPhrase(me?.prenom))
  const [video, setVideo] = useState('')
  const [loading, setLoading] = useState(false)

  const upl = (setter) => async (e) => { const f = e.target.files?.[0]; if (!f) return; setter(await fileToBase64(f)) }

  const submit = async () => {
    if (!piece) { toast.error('Ajoutez votre pièce d\u2019identité'); return }
    if (!moyen) { toast.error('Choisissez le moyen de paiement'); return }
    if (!ref && !preuve) { toast.error('Ajoutez la référence OU la capture du paiement'); return }
    if (!video) { toast.error('Enregistrez votre vidéo de présentation'); return }
    setLoading(true)
    const res = await api('/verification/documents', 'POST', { pieceIdentite: piece, preuvePaiement: preuve, moyenPaiement: moyen, referencePaiement: ref, videoPresentation: video, phraseVideo: phrase })
    setLoading(false)
    if (res.error) { toast.error(res.error); return }
    toast.success('Dossier envoyé ! Notre équipe va le vérifier.')
    refreshMe()
  }

  const UploadBox = ({ value, onChange, label, icon: Icon }) => (
    <label className="cursor-pointer block">
      <span className="text-sm font-medium">{label}</span>
      <div className={`mt-1 border-2 border-dashed rounded-xl p-4 flex items-center gap-3 hover:border-rose-400 transition-colors ${value ? 'border-emerald-400 bg-emerald-50/50' : 'border-border'}`}>
        {value ? <img src={value} alt="" className="h-16 w-16 object-cover rounded-lg" /> : <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center"><Icon className="h-6 w-6 text-muted-foreground" /></div>}
        <span className="text-sm text-muted-foreground">{value ? 'Fichier ajouté ✓ — cliquez pour changer' : 'Cliquez pour importer une image'}</span>
      </div>
      <input type="file" accept="image/*" className="hidden" onChange={onChange} />
    </label>
  )

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-rose-50 via-white to-amber-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <Card className="border-rose-100 mb-4">
          <CardContent className="pt-6 flex gap-3">
            <div className="bg-rose-100 rounded-full p-2 h-fit"><Mail className="h-5 w-5 text-rose-500" /></div>
            <div>
              <p className="font-semibold">Étape 2 — Vérification de votre dossier</p>
              <p className="text-sm text-muted-foreground mt-1">Bonjour {me.prenom}, pour garantir des rencontres sûres, merci d'envoyer votre <b>pièce d'identité</b> et la <b>preuve de votre paiement</b> (MoMo Money ou Orange Money). Après validation par notre équipe, vous recevrez vos accès pour compléter votre profil.</p>
              <p className="text-xs text-rose-500 mt-2">(Email de notification simulé — en attente de la clé d'envoi)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-rose-500" /> Vos documents</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <UploadBox value={piece} onChange={upl(setPiece)} label="Pièce d'identité (CNI, passeport)" icon={FileText} />

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm">
              <p className="font-medium flex items-center gap-1 text-amber-800"><CreditCard className="h-4 w-4" /> Frais de vérification</p>
              <p className="text-amber-700 mt-1">Effectuez votre paiement via <b>MoMo Money</b> ou <b>Orange Money</b> au numéro communiqué, puis indiquez la référence ou joignez la capture ci-dessous.</p>
            </div>

            <div>
              <Label>Moyen de paiement</Label>
              <Select value={moyen} onValueChange={setMoyen}>
                <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MoMo Money">MoMo Money (MTN)</SelectItem>
                  <SelectItem value="Orange Money">Orange Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Référence de la transaction</Label>
              <Input value={ref} onChange={e => setRef(e.target.value)} placeholder="Ex: MP240612.1534.A12345" />
            </div>
            <UploadBox value={preuve} onChange={upl(setPreuve)} label="OU capture d'écran du paiement (facultatif si référence fournie)" icon={Camera} />

            <VideoRecorder phrase={phrase} onRecorded={setVideo} />

            <div className="flex gap-2">
              <Button className="bg-rose-500 hover:bg-rose-600 flex-1" onClick={submit} disabled={loading}>{loading ? 'Envoi...' : 'Envoyer mon dossier'}</Button>
              <Button variant="ghost" onClick={logout}>Quitter</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ---------------- WAITING / REJECTED SCREENS ---------------- */
function WaitingScreen({ me, refreshMe, logout }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-4">
      <Card className="max-w-md text-center border-rose-100">
        <CardContent className="pt-8 pb-6">
          <div className="bg-blue-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4"><Clock className="h-8 w-8 text-blue-600" /></div>
          <h2 className="text-2xl font-bold">Demande en cours de validation</h2>
          <p className="text-muted-foreground mt-2">Merci {me.prenom} ! Un administrateur examine votre demande d'inscription. Votre profil deviendra <b>actif</b> dès sa validation, et vous recevrez un <b>email de confirmation</b>.</p>
          <p className="text-xs text-rose-500 mt-3">(Notification par email simulée)</p>
          <div className="flex gap-2 justify-center mt-6">
            <Button className="bg-rose-500 hover:bg-rose-600" onClick={refreshMe}>Actualiser mon statut</Button>
            <Button variant="outline" onClick={logout}>Se déconnecter</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RejectedScreen({ me, logout }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-4">
      <Card className="max-w-md text-center border-red-100">
        <CardContent className="pt-8 pb-6">
          <div className="bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4"><XCircle className="h-8 w-8 text-red-600" /></div>
          <h2 className="text-2xl font-bold">Dossier non validé</h2>
          <p className="text-muted-foreground mt-2">Votre dossier n'a pas pu être validé. Cela peut être dû à une pièce illisible ou un paiement introuvable. Contactez notre support pour plus d'informations.</p>
          <Button variant="outline" className="mt-6" onClick={logout}>Se déconnecter</Button>
        </CardContent>
      </Card>
    </div>
  )
}

/* ---------------- SELFIE CAPTURE (hommes) ---------------- */
function SelfieCapture({ value, onCapture }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [status, setStatus] = useState('idle')

  const start = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 480 }, audio: false })
      streamRef.current = s
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play() }
      setStatus('ready')
    } catch (e) { toast.error('Caméra inaccessible. Importez une photo à la place.') }
  }
  const snap = () => {
    const v = videoRef.current; if (!v) return
    const c = document.createElement('canvas'); c.width = v.videoWidth || 480; c.height = v.videoHeight || 360
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height)
    onCapture(c.toDataURL('image/jpeg', 0.8)); setStatus('captured')
    streamRef.current?.getTracks().forEach(t => t.stop())
  }
  const uploadFallback = async (e) => { const f = e.target.files?.[0]; if (!f) return; onCapture(await fileToBase64(f)); setStatus('captured'); streamRef.current?.getTracks().forEach(t => t.stop()) }
  const reset = () => { onCapture(''); setStatus('idle') }
  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])

  return (
    <div>
      <span className="text-sm font-medium">Selfie (visage bien visible)</span>
      <div className="mt-1 rounded-xl border p-3">
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          {status === 'captured' && value
            ? <img src={value} alt="selfie" className="w-full h-full object-contain bg-black" />
            : <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />}
          {status === 'idle' && <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm"><Camera className="h-6 w-6 mr-2" /> Caméra désactivée</div>}
        </div>
        <div className="flex gap-2 mt-3 flex-wrap items-center">
          {status === 'idle' && <>
            <Button type="button" variant="outline" onClick={start}><Camera className="h-4 w-4 mr-1" /> Activer la caméra</Button>
            <label className="text-sm text-rose-600 cursor-pointer underline">ou importer une photo<input type="file" accept="image/*" className="hidden" onChange={uploadFallback} /></label>
          </>}
          {status === 'ready' && <Button type="button" className="bg-rose-500 hover:bg-rose-600" onClick={snap}>Prendre le selfie</Button>}
          {status === 'captured' && <><span className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Selfie capturé</span><Button type="button" variant="ghost" size="sm" onClick={reset}>Reprendre</Button></>}
        </div>
      </div>
    </div>
  )
}

function MenVerificationStep({ me, api, refreshMe, logout }) {
  const [photo, setPhoto] = useState(me?.photo || '')
  const [selfie, setSelfie] = useState('')
  const [loading, setLoading] = useState(false)

  const uplPhoto = async (e) => { const f = e.target.files?.[0]; if (!f) return; setPhoto(await fileToBase64(f)) }

  const submit = async () => {
    if (!photo) { toast.error('Ajoutez une photo de profil'); return }
    if (!selfie) { toast.error('Ajoutez un selfie'); return }
    setLoading(true)
    const res = await api('/verification/selfie', 'POST', { photo, selfie })
    setLoading(false)
    if (res.error) { toast.error(res.error); return }
    toast.success('Demande envoyée ! Un administrateur va valider votre profil.')
    refreshMe()
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-rose-50 via-white to-amber-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <Card className="border-rose-100 mb-4">
          <CardContent className="pt-6 flex gap-3">
            <div className="bg-rose-100 rounded-full p-2 h-fit"><ShieldCheck className="h-5 w-5 text-rose-500" /></div>
            <div>
              <p className="font-semibold">Validez votre profil</p>
              <p className="text-sm text-muted-foreground mt-1">Bonjour {me.prenom}, pour garantir des rencontres sûres, ajoutez une <b>photo de profil</b> et un <b>selfie</b>. Après <b>validation par un administrateur</b>, votre profil deviendra actif et vous pourrez découvrir les profils des femmes.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Camera className="h-5 w-5 text-rose-500" /> Photo + Selfie</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <label className="cursor-pointer block">
              <span className="text-sm font-medium">Photo de profil</span>
              <div className={`mt-1 border-2 border-dashed rounded-xl p-4 flex items-center gap-3 hover:border-rose-400 transition-colors ${photo ? 'border-emerald-400 bg-emerald-50/50' : 'border-border'}`}>
                {photo ? <img src={photo} alt="" className="h-16 w-16 object-cover rounded-lg" /> : <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center"><User className="h-6 w-6 text-muted-foreground" /></div>}
                <span className="text-sm text-muted-foreground">{photo ? 'Photo ajoutée ✓ — cliquez pour changer' : 'Cliquez pour importer votre photo'}</span>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={uplPhoto} />
            </label>
            <SelfieCapture value={selfie} onCapture={setSelfie} />
            <div className="flex gap-2">
              <Button className="bg-rose-500 hover:bg-rose-600 flex-1" onClick={submit} disabled={loading}>{loading ? 'Validation...' : 'Valider mon profil'}</Button>
              <Button variant="ghost" onClick={logout}>Quitter</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ---------------- APP ---------------- */
function App() {
  const [token, setToken] = useState(null)
  const [me, setMe] = useState(null)
  const [view, setView] = useState('landing')
  const [profileId, setProfileId] = useState(null)
  const [activeChat, setActiveChat] = useState(null)
  const [unread, setUnread] = useState(0)
  const [booted, setBooted] = useState(false)

  const api = useCallback(async (path, method = 'GET', body) => {
    const t = token || (typeof window !== 'undefined' ? localStorage.getItem('ml_token') : null)
    try {
      const res = await fetch('/api' + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      })
      return await res.json()
    } catch (e) { return { error: 'Erreur réseau' } }
  }, [token])

  const refreshMe = useCallback(async () => { const r = await api('/me', 'GET'); if (r.user) setMe(r.user) }, [api])

  // boot
  useEffect(() => {
    (async () => {
      await fetch('/api/seed', { method: 'POST' })
      const t = localStorage.getItem('ml_token')
      if (t) {
        setToken(t)
        const r = await fetch('/api/me', { headers: { Authorization: 'Bearer ' + t } })
        const d = await r.json()
        if (d.user) { setMe(d.user); setView((d.user.genre === 'femme' && d.user.status === 'verifie' && !d.user.description) ? 'me' : 'discover') } else { localStorage.removeItem('ml_token') }
      }
      setBooted(true)
    })()
  }, [])

  // unread poll
  useEffect(() => {
    if (!me) return
    const load = async () => { const r = await api('/conversations', 'GET'); setUnread((r.conversations || []).reduce((s, c) => s + (c.unread || 0), 0)) }
    load(); const t = setInterval(load, 5000); return () => clearInterval(t)
  }, [me, api])

  const onAuth = (t, u) => { localStorage.setItem('ml_token', t); setToken(t); setMe(u); setView((u.genre === 'femme' && u.status === 'verifie' && !u.description) ? 'me' : 'discover') }
  const logout = () => { localStorage.removeItem('ml_token'); setToken(null); setMe(null); setView('landing') }
  const openProfile = (id) => { setProfileId(id); setView('profile') }
  const startChat = (u) => { setActiveChat(u); setView('messages') }

  if (!booted) return <div className="min-h-screen flex items-center justify-center"><Heart className="h-10 w-10 text-rose-500 fill-rose-500 animate-pulse" /></div>

  const forced = (me && me.role === 'user')
    ? (me.genre === 'femme'
      ? (me.status === 'documents_requis' ? 'documents' : me.status === 'en_verification' ? 'waiting' : me.status === 'rejete' ? 'rejected' : null)
      : (!me.selfie ? 'selfie' : me.status === 'en_verification' ? 'waiting' : me.status === 'rejete' ? 'rejected' : null))
    : null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar me={me} view={view} setView={setView} logout={logout} unread={unread} locked={!!forced} />
      {forced === 'documents' && <DocumentsStep me={me} api={api} refreshMe={refreshMe} logout={logout} />}
      {forced === 'waiting' && <WaitingScreen me={me} refreshMe={refreshMe} logout={logout} />}
      {forced === 'rejected' && <RejectedScreen me={me} logout={logout} />}
      {forced === 'selfie' && <MenVerificationStep me={me} api={api} refreshMe={refreshMe} logout={logout} />}
      {!forced && <>
        {view === 'landing' && <Landing setView={setView} />}
        {view === 'auth' && <AuthView onAuth={onAuth} api={api} />}
        {view === 'discover' && me && <Discover me={me} api={api} openProfile={openProfile} />}
        {view === 'profile' && profileId && <ProfileDetail profileId={profileId} api={api} back={() => setView('discover')} startChat={startChat} />}
        {view === 'messages' && me && <Messages me={me} api={api} activeChat={activeChat} setActiveChat={setActiveChat} />}
        {view === 'me' && me && <MyProfile me={me} api={api} refreshMe={refreshMe} />}
        {view === 'admin' && me && <Admin me={me} api={api} />}
      </>}
    </div>
  )
}

export default App
