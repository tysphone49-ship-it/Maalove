import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import crypto from 'node:crypto'

// MongoDB connection (singleton across warm invocations)
let client
let db
let dbPromise
let indexesReady = false

async function ensureIndexes(database) {
  if (indexesReady) return
  indexesReady = true
  try {
    await Promise.all([
      database.collection('ml_users').createIndex({ email: 1 }, { unique: true }),
      database.collection('ml_users').createIndex({ id: 1 }, { unique: true }),
      database.collection('ml_sessions').createIndex({ token: 1 }, { unique: true }),
      database.collection('ml_sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      database.collection('ml_messages').createIndex({ conversationId: 1, createdAt: 1 }),
      database.collection('ml_password_resets').createIndex({ userId: 1 }),
      database.collection('ml_password_resets').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ])
  } catch (e) { console.error('ensureIndexes:', e.message) }
}

async function connectToMongo() {
  if (db) return db
  if (!dbPromise) {
    if (!process.env.MONGO_URL) throw new Error('MONGO_URL is not set')
    const c = new MongoClient(process.env.MONGO_URL)
    dbPromise = c.connect().then(async (connected) => {
      client = connected
      db = connected.db(process.env.DB_NAME)
      await ensureIndexes(db)
      return db
    }).catch((e) => { dbPromise = null; throw e })
  }
  return dbPromise
}

// CORS: n'émet des en-têtes cross-origin que si CORS_ORIGINS est défini (l'app appelle son API en same-origin)
function handleCORS(response) {
  const origin = process.env.CORS_ORIGINS
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Vary', 'Origin')
    if (origin !== '*') response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// ---------- Mots de passe (scrypt, sans dépendance) ----------
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex')
  const dk = crypto.scryptSync(String(pw), salt, 64).toString('hex')
  return `scrypt$${salt}$${dk}`
}
function isHashed(s) { return typeof s === 'string' && s.startsWith('scrypt$') }
function verifyPassword(pw, stored) {
  if (!stored) return false
  if (!isHashed(stored)) return stored === pw
  const [, salt, dk] = stored.split('$')
  try {
    const dkBuf = Buffer.from(dk, 'hex')
    const test = crypto.scryptSync(String(pw), salt, 64)
    return dkBuf.length === test.length && crypto.timingSafeEqual(dkBuf, test)
  } catch { return false }
}
function escapeRegex(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

// ---------- Sessions (jeton opaque, découplé de l'id utilisateur) ----------
const SESSION_TTL_DAYS = 30
async function createSession(database, userId) {
  const token = crypto.randomBytes(32).toString('hex')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_TTL_DAYS * 24 * 3600 * 1000)
  await database.collection('ml_sessions').insertOne({ token, userId, createdAt: now, expiresAt })
  return token
}
async function destroySession(database, token) {
  if (token) await database.collection('ml_sessions').deleteOne({ token })
}

function clean(doc) {
  if (!doc) return doc
  const { _id, password, ...rest } = doc
  return rest
}
function publicProfile(doc) {
  if (!doc) return doc
  const { _id, password, email, phone, ...rest } = doc
  return rest
}

async function getUser(request, db) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return null
  const sess = await db.collection('ml_sessions').findOne({ token })
  if (!sess) return null
  if (sess.expiresAt && new Date(sess.expiresAt) < new Date()) {
    await db.collection('ml_sessions').deleteOne({ token })
    return null
  }
  const user = await db.collection('ml_users').findOne({ id: sess.userId })
  return user || null
}

function convId(a, b) { return [a, b].sort().join('__') }

const ADMIN_NOTIF_EMAIL = process.env.ADMIN_NOTIF_EMAIL || 'maalove237@gmail.com'

// Transporteur e-mail : SMTP générique (OVH…) en priorité, sinon Gmail, sinon MOCK
let mailTransporter
function getTransporter() {
  if (mailTransporter !== undefined) return mailTransporter
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    const port = parseInt(process.env.SMTP_PORT || '465')
    const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465
    mailTransporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } })
  } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    mailTransporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '') } })
  } else {
    mailTransporter = null
  }
  return mailTransporter
}
function mailFrom() { return process.env.MAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'no-reply@maalove.app' }

async function sendEmail(to, subject, text) {
  try {
    const t = getTransporter()
    if (t) {
      await t.sendMail({ from: `Maalove <${mailFrom()}>`, to, subject, text })
      return { sent: true }
    }
    console.log(`[EMAIL MOCK] to=${to} | subject="${subject}"`)
    return { mock: true }
  } catch (e) { console.error('sendEmail error:', e.message); return { error: e.message } }
}

async function notifyAdmin(db, type, message, meta = {}) {
  try {
    await db.collection('ml_notifications').insertOne({ id: uuidv4(), type, message, meta, read: false, createdAt: new Date() })
    await sendEmail(ADMIN_NOTIF_EMAIL, `Maalove — ${type}`, message)
  } catch (e) { console.error('notifyAdmin error', e) }
}

const WOMEN_IMGS = [
  'https://images.unsplash.com/photo-1534470717-233b39a41c54?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1611432579402-7037e3e2c1e4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1593351799227-75df2026356b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1554727242-741c14fa561c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1618298363483-e31a31f1a1e2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1508002366005-75a695ee2d17?auto=format&fit=crop&w=800&q=80',
]
const MEN_IMGS = [
  'https://images.unsplash.com/photo-1600603406200-5b2a104684ac?crop=entropy&cs=srgb&fm=jpg&q=85&w=800',
  'https://images.unsplash.com/photo-1612681051163-6c1ad652d143?crop=entropy&cs=srgb&fm=jpg&q=85&w=800',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=srgb&fm=jpg&q=85&w=800',
  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?crop=entropy&cs=srgb&fm=jpg&q=85&w=800',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=srgb&fm=jpg&q=85&w=800',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=srgb&fm=jpg&q=85&w=800',
]

function seedUsers(hashedDemoPw) {
  const now = new Date()
  const women = [
    { prenom: 'Aïcha', age: 27, ville: 'Douala', profession: 'Infirmière', langues: ['Français','Anglais'], situationFamiliale: 'Célibataire', enfants: 'Non', etudes: 'Licence', religion: 'Chrétienne', projetFamilial: 'Fonder une famille', interets: ['Cuisine','Voyages','Musique'], description: "Douce et attentionnée, je cherche une relation sincère et durable." },
    { prenom: 'Nadège', age: 31, ville: 'Yaoundé', profession: 'Comptable', langues: ['Français'], situationFamiliale: 'Divorcée', enfants: 'Oui', etudes: 'Master', religion: 'Chrétienne', projetFamilial: 'Fonder une famille', interets: ['Lecture','Danse','Mode'], description: "Maman épanouie, je rêve d'un partenaire respectueux et bienveillant." },
    { prenom: 'Larissa', age: 24, ville: 'Bafoussam', profession: 'Étudiante', langues: ['Français','Anglais'], situationFamiliale: 'Célibataire', enfants: 'Non', etudes: 'Licence en cours', religion: 'Chrétienne', projetFamilial: 'Ouverte à l\'avenir', interets: ['Sport','Photographie','Cinéma'], description: "Pétillante et curieuse, j'aime découvrir de nouvelles cultures." },
    { prenom: 'Mireille', age: 34, ville: 'Kribi', profession: 'Enseignante', langues: ['Français','Anglais'], situationFamiliale: 'Célibataire', enfants: 'Non', etudes: 'Master', religion: 'Chrétienne', projetFamilial: 'Fonder une famille', interets: ['Nature','Cuisine','Voyages'], description: "Femme posée et ambitieuse, je privilégie les valeurs et le respect." },
    { prenom: 'Sandrine', age: 29, ville: 'Buea', profession: 'Coiffeuse', langues: ['Anglais','Français'], situationFamiliale: 'Célibataire', enfants: 'Oui', etudes: 'Formation pro', religion: 'Chrétienne', projetFamilial: 'Fonder une famille', interets: ['Mode','Musique','Danse'], description: "Joyeuse et travailleuse, je cherche l'homme de ma vie." },
    { prenom: 'Chantal', age: 26, ville: 'Douala', profession: 'Assistante RH', langues: ['Français'], situationFamiliale: 'Célibataire', enfants: 'Non', etudes: 'Licence', religion: 'Chrétienne', projetFamilial: 'Fonder une famille', interets: ['Voyages','Lecture','Cuisine'], description: "Romantique dans l'âme, je crois à l'amour vrai." },
  ]
  const men = [
    { prenom: 'Julien', age: 38, ville: 'Paris', profession: 'Ingénieur', langues: ['Français','Anglais'], situationFamiliale: 'Célibataire', enfants: 'Non', etudes: 'Master', religion: 'Non pratiquant', projetFamilial: 'Fonder une famille', interets: ['Voyages','Randonnée','Gastronomie'], description: "Sérieux et attentionné, je souhaite construire une vraie histoire." },
    { prenom: 'Marc', age: 45, ville: 'Lyon', profession: 'Commerçant', langues: ['Français'], situationFamiliale: 'Divorcé', enfants: 'Oui', etudes: 'Bac+2', religion: 'Catholique', projetFamilial: 'Fonder une famille', interets: ['Cuisine','Vin','Musique'], description: "Père de famille, je recherche une compagne aimante et sincère." },
    { prenom: 'Thomas', age: 34, ville: 'Bordeaux', profession: 'Architecte', langues: ['Français','Anglais','Espagnol'], situationFamiliale: 'Célibataire', enfants: 'Non', etudes: 'Master', religion: 'Non pratiquant', projetFamilial: 'Fonder une famille', interets: ['Art','Voyages','Sport'], description: "Passionné et curieux, ouvert à la découverte de nouvelles cultures." },
    { prenom: 'Antoine', age: 41, ville: 'Marseille', profession: 'Chef cuisinier', langues: ['Français'], situationFamiliale: 'Célibataire', enfants: 'Non', etudes: 'CAP', religion: 'Catholique', projetFamilial: 'Fonder une famille', interets: ['Cuisine','Mer','Voyages'], description: "Généreux et chaleureux, je cherche à partager le meilleur." },
    { prenom: 'Pierre', age: 52, ville: 'Toulouse', profession: 'Retraité', langues: ['Français'], situationFamiliale: 'Veuf', enfants: 'Oui', etudes: 'Bac', religion: 'Catholique', projetFamilial: 'Relation stable', interets: ['Jardinage','Lecture','Voyages'], description: "Calme et bienveillant, je souhaite refaire ma vie à deux." },
    { prenom: 'Nicolas', age: 36, ville: 'Nantes', profession: 'Développeur', langues: ['Français','Anglais'], situationFamiliale: 'Célibataire', enfants: 'Non', etudes: 'Master', religion: 'Non pratiquant', projetFamilial: 'Fonder une famille', interets: ['Tech','Musique','Voyages'], description: "Doux et à l'écoute, je crois aux relations sérieuses et durables." },
  ]
  const docs = []
  women.forEach((w, i) => {
    docs.push({ id: uuidv4(), email: `femme${i+1}@maalove.demo`, password: hashedDemoPw, role: 'user', genre: 'femme', pays: 'Cameroun', photo: WOMEN_IMGS[i], status: i < 4 ? 'verifie' : 'en_attente', emailVerified: true, phoneVerified: i % 2 === 0, phone: '', createdAt: now, criteres: { ageMin: 30, ageMax: 55, pays: 'France' }, ...w })
  })
  men.forEach((m, i) => {
    docs.push({ id: uuidv4(), email: `homme${i+1}@maalove.demo`, password: hashedDemoPw, role: 'user', genre: 'homme', pays: 'France', photo: MEN_IMGS[i], status: i < 4 ? 'verifie' : 'en_attente', emailVerified: true, phoneVerified: i % 2 === 0, phone: '', createdAt: now, criteres: { ageMin: 22, ageMax: 40, pays: 'Cameroun' }, ...m })
  })
  return docs
}

async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // ---------- SEED (protégé : SEED_SECRET + admin via env, haché) ----------
    if (route === '/seed' && method === 'POST') {
      const provided = (request.headers.get('authorization') || '').replace('Bearer ', '').trim()
      if (!process.env.SEED_SECRET || provided !== process.env.SEED_SECRET) {
        return handleCORS(NextResponse.json({ error: 'Accès refusé' }, { status: 403 }))
      }
      if (!process.env.ADMIN_PASSWORD) {
        return handleCORS(NextResponse.json({ error: 'ADMIN_PASSWORD non configuré' }, { status: 400 }))
      }
      const count = await db.collection('ml_users').countDocuments()
      if (count === 0) {
        const admin = {
          id: uuidv4(), email: (process.env.ADMIN_EMAIL || 'admin@maalove.com').toLowerCase(),
          password: hashPassword(process.env.ADMIN_PASSWORD), role: 'admin',
          genre: 'homme', prenom: 'Admin', age: 30, ville: 'Paris', pays: 'France',
          photo: '', status: 'verifie', emailVerified: true, phoneVerified: true,
          langues: ['Français'], interets: [], createdAt: new Date(),
        }
        await db.collection('ml_users').insertOne(admin)
        await db.collection('ml_users').insertMany(seedUsers(hashPassword('demo-' + uuidv4())))
      }
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // ---------- AUTH ----------
    if (route === '/auth/register' && method === 'POST') {
      const b = await request.json()
      if (!b.email || !b.password || !b.prenom || !b.genre) {
        return handleCORS(NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 }))
      }
      if (String(b.password).length < 8) {
        return handleCORS(NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 }))
      }
      const exists = await db.collection('ml_users').findOne({ email: b.email.toLowerCase() })
      if (exists) return handleCORS(NextResponse.json({ error: 'Email déjà utilisé' }, { status: 400 }))
      const user = {
        id: uuidv4(), email: b.email.toLowerCase(), password: hashPassword(b.password), role: 'user',
        prenom: b.prenom, genre: b.genre, age: parseInt(b.age) || null, ville: b.ville || '',
        pays: b.pays || (b.genre === 'femme' ? 'Cameroun' : 'France'),
        photo: b.photo || '', photos: b.photo ? [b.photo] : [],
        status: b.genre === 'femme' ? 'documents_requis' : 'en_attente',
        emailVerified: false, phoneVerified: false,
        pieceIdentite: '', preuvePaiement: '', referencePaiement: '', moyenPaiement: '', selfie: '',
        phone: b.phone || '', langues: [], interets: [], criteres: {}, createdAt: new Date(),
      }
      await db.collection('ml_users').insertOne(user)
      await notifyAdmin(db, 'Nouvelle inscription', `${user.prenom} (${user.genre}, ${user.pays}) vient de s'inscrire.`, { userId: user.id })
      const etapeSuivante = user.genre === 'femme'
        ? "Prochaine étape : choisissez votre forfait et envoyez votre preuve de paiement pour faire vérifier votre profil."
        : "Prochaine étape : ajoutez une photo de profil et un selfie pour accéder aux profils."
      await sendEmail(user.email, 'Bienvenue sur Maalove', `Bonjour ${user.prenom},\n\nVotre compte Maalove a bien été créé. ${etapeSuivante}\n\nÀ très vite,\nL'équipe Maalove`)
      const token = await createSession(db, user.id)
      return handleCORS(NextResponse.json({ token, user: clean(user) }))
    }

    if (route === '/auth/login' && method === 'POST') {
      const b = await request.json()
      const user = await db.collection('ml_users').findOne({ email: (b.email || '').toLowerCase() })
      if (!user || !verifyPassword(b.password, user.password)) {
        return handleCORS(NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 }))
      }
      if (!isHashed(user.password)) {
        await db.collection('ml_users').updateOne({ id: user.id }, { $set: { password: hashPassword(b.password) } })
      }
      const token = await createSession(db, user.id)
      return handleCORS(NextResponse.json({ token, user: clean(user) }))
    }

    if (route === '/auth/logout' && method === 'POST') {
      const auth = request.headers.get('authorization') || ''
      await destroySession(db, auth.replace('Bearer ', '').trim())
      return handleCORS(NextResponse.json({ ok: true }))
    }

    if (route === '/auth/forgot-password' && method === 'POST') {
      const b = await request.json()
      const email = (b.email || '').toLowerCase()
      const user = email ? await db.collection('ml_users').findOne({ email }) : null
      if (user) {
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
        await db.collection('ml_password_resets').insertOne({ id: uuidv4(), userId: user.id, email, code, createdAt: new Date(), expiresAt })
        await sendEmail(email, 'Maalove — Réinitialisation du mot de passe', `Bonjour ${user.prenom || ''},\n\nVotre code de réinitialisation est : ${code}\n\nCe code est valable 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.\n\nL'équipe Maalove`)
      }
      return handleCORS(NextResponse.json({ ok: true }))
    }

    if (route === '/auth/reset-password' && method === 'POST') {
      const b = await request.json()
      const email = (b.email || '').toLowerCase()
      if (!b.code || !b.password) return handleCORS(NextResponse.json({ error: 'Code et nouveau mot de passe requis' }, { status: 400 }))
      if (String(b.password).length < 8) return handleCORS(NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 }))
      const user = email ? await db.collection('ml_users').findOne({ email }) : null
      const rec = user ? await db.collection('ml_password_resets').findOne({ userId: user.id, code: String(b.code) }, { sort: { createdAt: -1 } }) : null
      if (!user || !rec || (rec.expiresAt && new Date(rec.expiresAt) < new Date())) {
        return handleCORS(NextResponse.json({ error: 'Code invalide ou expiré' }, { status: 400 }))
      }
      await db.collection('ml_users').updateOne({ id: user.id }, { $set: { password: hashPassword(b.password) } })
      await db.collection('ml_password_resets').deleteMany({ userId: user.id })
      await db.collection('ml_sessions').deleteMany({ userId: user.id })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    if (route === '/me' && method === 'GET') {
      const user = await getUser(request, db)
      if (!user) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      return handleCORS(NextResponse.json({ user: clean(user) }))
    }

    if (route === '/profile' && method === 'PUT') {
      const user = await getUser(request, db)
      if (!user) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      const b = await request.json()
      const allowed = ['prenom','age','ville','pays','photo','photos','profession','langues','situationFamiliale','enfants','etudes','interets','description','religion','projetFamilial','criteres','phone']
      const update = {}
      for (const k of allowed) if (k in b) update[k] = k === 'age' ? (parseInt(b[k]) || null) : b[k]
      if (Array.isArray(b.photos) && b.photos.length) update.photo = b.photos[0]
      await db.collection('ml_users').updateOne({ id: user.id }, { $set: update })
      const updated = await db.collection('ml_users').findOne({ id: user.id })
      return handleCORS(NextResponse.json({ user: clean(updated) }))
    }

    // ---------- OTP ----------
    if (route === '/otp/send' && method === 'POST') {
      const user = await getUser(request, db)
      if (!user) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      const b = await request.json()
      const type = b.type || 'email'
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      await db.collection('ml_otp').insertOne({ id: uuidv4(), userId: user.id, type, code, createdAt: new Date() })
      let delivered = false
      if (type === 'email' && user.email) {
        const r = await sendEmail(user.email, 'Maalove — Code de vérification', `Votre code de vérification est : ${code}`)
        delivered = !!r.sent
      }
      const isProd = process.env.NODE_ENV === 'production'
      return handleCORS(NextResponse.json({ ok: true, delivered, ...(isProd ? {} : { mock: true, code }) }))
    }

    if (route === '/otp/verify' && method === 'POST') {
      const user = await getUser(request, db)
      if (!user) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      const b = await request.json()
      const rec = await db.collection('ml_otp').findOne({ userId: user.id, type: b.type || 'email' }, { sort: { createdAt: -1 } })
      if (!rec || rec.code !== b.code) return handleCORS(NextResponse.json({ error: 'Code incorrect' }, { status: 400 }))
      const field = (b.type === 'phone') ? 'phoneVerified' : 'emailVerified'
      await db.collection('ml_users').updateOne({ id: user.id }, { $set: { [field]: true } })
      await db.collection('ml_otp').deleteMany({ userId: user.id, type: b.type || 'email' })
      const updated = await db.collection('ml_users').findOne({ id: user.id })
      return handleCORS(NextResponse.json({ user: clean(updated) }))
    }

    // ---------- VERIFICATION (femmes) : paiement + forfait uniquement ----------
    if (route === '/verification/documents' && method === 'POST') {
      const user = await getUser(request, db)
      if (!user) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      const b = await request.json()
      if (!b.moyenPaiement || (!b.referencePaiement && !b.preuvePaiement)) {
        return handleCORS(NextResponse.json({ error: 'Moyen de paiement et référence/capture requis' }, { status: 400 }))
      }
      await db.collection('ml_users').updateOne({ id: user.id }, { $set: {
        preuvePaiement: b.preuvePaiement || '',
        referencePaiement: b.referencePaiement || '', moyenPaiement: b.moyenPaiement,
        forfaitMois: parseInt(b.forfaitMois) || null, forfaitCoach: !!b.forfaitCoach, forfaitMontant: parseInt(b.forfaitMontant) || null,
        status: 'en_verification',
      } })
      const updated = await db.collection('ml_users').findOne({ id: user.id })
      await notifyAdmin(db, 'Dossier à vérifier', `${user.prenom} a envoyé sa preuve de paiement (${b.moyenPaiement}).`, { userId: user.id })
      await sendEmail(user.email, 'Maalove — Dossier bien reçu', `Bonjour ${user.prenom},\n\nNous avons bien reçu votre paiement. Votre profil est en cours de vérification ; vous recevrez un e-mail dès qu'il sera validé.\n\nL'équipe Maalove`)
      return handleCORS(NextResponse.json({ user: clean(updated) }))
    }

    // ---------- VERIFICATION SELFIE (hommes) ----------
    if (route === '/verification/selfie' && method === 'POST') {
      const user = await getUser(request, db)
      if (!user) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      const b = await request.json()
      const photo = b.photo || user.photo
      if (!photo || !b.selfie) {
        return handleCORS(NextResponse.json({ error: 'Une photo de profil et un selfie sont requis' }, { status: 400 }))
      }
      await db.collection('ml_users').updateOne({ id: user.id }, { $set: {
        photo, photos: [photo, ...((user.photos || []).filter(p => p && p !== photo))].slice(0, 4),
        selfie: b.selfie, status: 'en_verification',
      } })
      const updated = await db.collection('ml_users').findOne({ id: user.id })
      await notifyAdmin(db, 'Demande à valider', `${user.prenom} (homme) a soumis sa photo et son selfie.`, { userId: user.id })
      await sendEmail(user.email, 'Maalove — Demande bien reçue', `Bonjour ${user.prenom},\n\nNous avons bien reçu votre photo et votre selfie. Votre profil est en cours de validation ; vous recevrez un e-mail dès qu'il sera validé.\n\nL'équipe Maalove`)
      return handleCORS(NextResponse.json({ user: clean(updated) }))
    }

    if (route === '/discover' && method === 'GET') {
      const user = await getUser(request, db)
      if (!user) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      if (user.role === 'user' && user.genre === 'homme' && user.status !== 'verifie') {
        return handleCORS(NextResponse.json({ error: 'Profil en attente de validation', needSelfie: !user.selfie, pending: true }, { status: 403 }))
      }
      const url = new URL(request.url)
      const q = Object.fromEntries(url.searchParams)
      const targetGenre = user.genre === 'homme' ? 'femme' : 'homme'
      const blocks = await db.collection('ml_blocks').find({ blockerId: user.id }).toArray()
      const blockedIds = blocks.map(x => x.blockedId)
      const filter = { genre: targetGenre, role: 'user', id: { $nin: [user.id, ...blockedIds] }, status: { $nin: ['documents_requis', 'en_verification', 'rejete'] } }
      if (q.pays) filter.pays = q.pays
      if (q.langue) filter.langues = q.langue
      if (q.religion) filter.religion = q.religion
      if (q.profession) filter.profession = { $regex: escapeRegex(q.profession), $options: 'i' }
      if (q.enfants) filter.enfants = q.enfants
      if (q.projetFamilial) filter.projetFamilial = q.projetFamilial
      if (q.ageMin || q.ageMax) {
        filter.age = {}
        if (q.ageMin) filter.age.$gte = parseInt(q.ageMin)
        if (q.ageMax) filter.age.$lte = parseInt(q.ageMax)
      }
      if (q.verifie === 'true') filter.status = 'verifie'
      const list = await db.collection('ml_users').find(filter).limit(100).toArray()
      list.sort((a, b2) => (a.status === 'verifie' ? -1 : 1) - (b2.status === 'verifie' ? -1 : 1))
      return handleCORS(NextResponse.json({ profiles: list.map(publicProfile) }))
    }

    if (route.startsWith('/users/') && method === 'GET') {
      const requester = await getUser(request, db)
      if (!requester) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      const id = route.split('/')[2]
      const u = await db.collection('ml_users').findOne({ id })
      if (!u) return handleCORS(NextResponse.json({ error: 'Introuvable' }, { status: 404 }))
      return handleCORS(NextResponse.json({ profile: publicProfile(u) }))
    }

    // ---------- MESSAGING ----------
    if (route === '/conversations' && method === 'GET') {
      const user = await getUser(request, db)
      if (!user) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      const msgs = await db.collection('ml_messages').find({ $or: [{ senderId: user.id }, { receiverId: user.id }] }).sort({ createdAt: -1 }).toArray()
      const map = {}
      for (const m of msgs) {
        const other = m.senderId === user.id ? m.receiverId : m.senderId
        if (!map[other]) map[other] = { otherId: other, lastMessage: m.text, lastAt: m.createdAt, unread: 0 }
        if (m.receiverId === user.id && !m.read) map[other].unread++
      }
      const others = Object.keys(map)
      const users = await db.collection('ml_users').find({ id: { $in: others } }).toArray()
      const uById = {}
      users.forEach(u => { uById[u.id] = publicProfile(u) })
      const convs = Object.values(map).map(c => ({ ...c, user: uById[c.otherId] })).filter(c => c.user)
      return handleCORS(NextResponse.json({ conversations: convs }))
    }

    if (route.startsWith('/messages/') && method === 'GET') {
      const user = await getUser(request, db)
      if (!user) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      const other = route.split('/')[2]
      const cid = convId(user.id, other)
      await db.collection('ml_messages').updateMany({ conversationId: cid, receiverId: user.id, read: { $ne: true } }, { $set: { read: true } })
      const msgs = await db.collection('ml_messages').find({ conversationId: cid }).sort({ createdAt: 1 }).toArray()
      const otherUser = await db.collection('ml_users').findOne({ id: other })
      return handleCORS(NextResponse.json({ messages: msgs.map(clean), otherUser: publicProfile(otherUser) }))
    }

    if (route === '/messages' && method === 'POST') {
      const user = await getUser(request, db)
      if (!user) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      const b = await request.json()
      if (!b.receiverId || !b.text) return handleCORS(NextResponse.json({ error: 'Champs requis' }, { status: 400 }))
      const blocked = await db.collection('ml_blocks').findOne({ blockerId: b.receiverId, blockedId: user.id })
      if (blocked) return handleCORS(NextResponse.json({ error: "Vous ne pouvez pas contacter cet utilisateur" }, { status: 403 }))
      const msg = { id: uuidv4(), conversationId: convId(user.id, b.receiverId), senderId: user.id, receiverId: b.receiverId, text: String(b.text).slice(0, 5000), read: false, createdAt: new Date() }
      await db.collection('ml_messages').insertOne(msg)
      const isFirst = (await db.collection('ml_messages').countDocuments({ conversationId: msg.conversationId })) === 1
      if (isFirst) await notifyAdmin(db, 'Nouvelle conversation', `${user.prenom} a démarré une nouvelle conversation.`, { conversationId: msg.conversationId })
      return handleCORS(NextResponse.json({ message: clean(msg) }))
    }

    if (route === '/block' && method === 'POST') {
      const user = await getUser(request, db)
      if (!user) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      const b = await request.json()
      await db.collection('ml_blocks').insertOne({ id: uuidv4(), blockerId: user.id, blockedId: b.blockedId, createdAt: new Date() })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    if (route === '/report' && method === 'POST') {
      const user = await getUser(request, db)
      if (!user) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      const b = await request.json()
      await db.collection('ml_reports').insertOne({ id: uuidv4(), reporterId: user.id, reportedId: b.reportedId, reason: b.reason, details: b.details || '', status: 'ouvert', createdAt: new Date() })
      await notifyAdmin(db, 'Nouveau signalement', `Signalement reçu — motif : ${b.reason}.`, { reportedId: b.reportedId })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    if (route === '/support/ticket' && method === 'POST') {
      const user = await getUser(request, db)
      if (!user) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      const b = await request.json()
      await db.collection('ml_tickets').insertOne({ id: uuidv4(), userId: user.id, sujet: b.sujet, message: b.message, status: 'ouvert', createdAt: new Date() })
      await notifyAdmin(db, 'Nouveau ticket support', `${user.prenom} a ouvert un ticket : ${b.sujet}.`, { userId: user.id })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    if (route === '/testimonials' && method === 'GET') {
      const list = await db.collection('ml_testimonials').find({}).sort({ createdAt: -1 }).limit(50).toArray()
      return handleCORS(NextResponse.json({ testimonials: list.map(clean) }))
    }

    // ---------- ADMIN ----------
    const adminRoutes = route.startsWith('/admin')
    if (adminRoutes) {
      const user = await getUser(request, db)
      if (!user || !['admin','moderateur','support'].includes(user.role)) {
        return handleCORS(NextResponse.json({ error: 'Accès refusé' }, { status: 403 }))
      }

      if (route === '/admin/stats' && method === 'GET') {
        const totalUsers = await db.collection('ml_users').countDocuments({ role: 'user' })
        const verifies = await db.collection('ml_users').countDocuments({ status: 'verifie', role: 'user' })
        const enAttente = await db.collection('ml_users').countDocuments({ status: { $in: ['en_attente', 'en_verification'] }, role: 'user' })
        const femmes = await db.collection('ml_users').countDocuments({ genre: 'femme', role: 'user' })
        const hommes = await db.collection('ml_users').countDocuments({ genre: 'homme', role: 'user' })
        const messages = await db.collection('ml_messages').countDocuments()
        const signalements = await db.collection('ml_reports').countDocuments({ status: 'ouvert' })
        const tickets = await db.collection('ml_tickets').countDocuments({ status: 'ouvert' })
        return handleCORS(NextResponse.json({ stats: { totalUsers, verifies, enAttente, femmes, hommes, messages, signalements, tickets } }))
      }

      if (route === '/admin/verifications' && method === 'GET') {
        const list = await db.collection('ml_users').find({ status: { $in: ['en_attente', 'en_verification'] }, role: 'user' }).sort({ createdAt: -1 }).toArray()
        return handleCORS(NextResponse.json({ users: list.map(clean) }))
      }

      if (route === '/admin/verify' && method === 'POST') {
        const b = await request.json()
        const now = new Date()
        await db.collection('ml_users').updateOne({ id: b.userId }, { $set: { status: b.decision, decidedBy: user.prenom, decidedById: user.id, decidedAt: now } })
        const target = await db.collection('ml_users').findOne({ id: b.userId })
        await db.collection('ml_decisions').insertOne({ id: uuidv4(), userId: b.userId, userPrenom: target?.prenom || '', userGenre: target?.genre || '', decision: b.decision, adminId: user.id, adminNom: user.prenom, at: now })
        if (target) {
          if (b.decision === 'verifie') {
            await sendEmail(target.email, 'Maalove — Votre compte est validé', `Bonjour ${target.prenom}, votre compte a été validé. Identifiants : ${target.email}. Connectez-vous pour compléter votre profil et ajouter jusqu'à 4 photos.`)
          } else if (b.decision === 'rejete') {
            await sendEmail(target.email, 'Maalove — Dossier non validé', `Bonjour ${target.prenom}, votre dossier n'a pas pu être validé. Contactez le support pour plus d'informations.`)
          }
        }
        return handleCORS(NextResponse.json({ ok: true }))
      }

      if (route === '/admin/decisions' && method === 'GET') {
        const list = await db.collection('ml_decisions').find({}).sort({ at: -1 }).limit(200).toArray()
        return handleCORS(NextResponse.json({ decisions: list.map(clean) }))
      }

      if (route === '/admin/testimonials' && method === 'POST') {
        const b = await request.json()
        if (!b.message) return handleCORS(NextResponse.json({ error: 'Message requis' }, { status: 400 }))
        const t = { id: uuidv4(), nom: b.nom || 'Anonyme', message: b.message, photo: b.photo || '', createdAt: new Date() }
        await db.collection('ml_testimonials').insertOne(t)
        return handleCORS(NextResponse.json({ testimonial: clean(t) }))
      }

      if (route === '/admin/testimonials' && method === 'DELETE') {
        const b = await request.json()
        await db.collection('ml_testimonials').deleteOne({ id: b.id })
        return handleCORS(NextResponse.json({ ok: true }))
      }

      if (route === '/admin/notifications' && method === 'GET') {
        const list = await db.collection('ml_notifications').find({}).sort({ createdAt: -1 }).limit(100).toArray()
        const unread = await db.collection('ml_notifications').countDocuments({ read: false })
        return handleCORS(NextResponse.json({ notifications: list.map(clean), unread, email: ADMIN_NOTIF_EMAIL }))
      }

      if (route === '/admin/notifications/read' && method === 'POST') {
        await db.collection('ml_notifications').updateMany({ read: false }, { $set: { read: true } })
        return handleCORS(NextResponse.json({ ok: true }))
      }

      if (route === '/admin/users' && method === 'GET') {
        const list = await db.collection('ml_users').find({ role: 'user' }).sort({ createdAt: -1 }).limit(500).toArray()
        return handleCORS(NextResponse.json({ users: list.map(clean) }))
      }

      if (route === '/admin/reports' && method === 'GET') {
        const reports = await db.collection('ml_reports').find({}).sort({ createdAt: -1 }).toArray()
        const ids = [...new Set(reports.flatMap(r => [r.reporterId, r.reportedId]))]
        const users = await db.collection('ml_users').find({ id: { $in: ids } }).toArray()
        const uById = {}; users.forEach(u => { uById[u.id] = { id: u.id, prenom: u.prenom, photo: u.photo } })
        return handleCORS(NextResponse.json({ reports: reports.map(r => ({ ...clean(r), reporter: uById[r.reporterId], reported: uById[r.reportedId] })) }))
      }

      if (route === '/admin/reports/resolve' && method === 'POST') {
        const b = await request.json()
        await db.collection('ml_reports').updateOne({ id: b.reportId }, { $set: { status: b.status || 'resolu' } })
        return handleCORS(NextResponse.json({ ok: true }))
      }

      if (route === '/admin/tickets' && method === 'GET') {
        const tickets = await db.collection('ml_tickets').find({}).sort({ createdAt: -1 }).toArray()
        const ids = tickets.map(t => t.userId)
        const users = await db.collection('ml_users').find({ id: { $in: ids } }).toArray()
        const uById = {}; users.forEach(u => { uById[u.id] = { prenom: u.prenom, email: u.email } })
        return handleCORS(NextResponse.json({ tickets: tickets.map(t => ({ ...clean(t), user: uById[t.userId] })) }))
      }

      if (route === '/admin/tickets/resolve' && method === 'POST') {
        const b = await request.json()
        await db.collection('ml_tickets').updateOne({ id: b.ticketId }, { $set: { status: 'resolu' } })
        return handleCORS(NextResponse.json({ ok: true }))
      }
    }

    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
