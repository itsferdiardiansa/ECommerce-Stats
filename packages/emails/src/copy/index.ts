export type Locale = 'en' | 'id'

export interface CodeVars {
  name: string
  code: string
  minutes: number
}

export interface AlertVars {
  name: string
  where: string
}

export interface CodeStrings {
  subject: string
  preview: string
  heading: string
  greeting: string
  body: string
  expiry: string
  footer: string
}

export interface AlertStrings {
  subject: string
  preview: string
  heading: string
  greeting: string
  body: string
  whereLabel: string
  where: string
  action: string
  footer: string
}

type CodeName = 'verification-code' | 'step-up-otp'
type AlertName =
  | 'new-sign-in'
  | 'blocked-attempt'
  | 'suspicious-login'
  | 'session-compromise'

type CodeBuilders = Record<CodeName, (v: CodeVars) => CodeStrings>
type AlertBuilders = Record<AlertName, (v: AlertVars) => AlertStrings>

const en: CodeBuilders & AlertBuilders = {
  'verification-code': v => ({
    subject: 'Verify your email address',
    preview: 'Your verification code',
    heading: 'Confirm your email address',
    greeting: `Hi ${v.name},`,
    body: 'Use this code to finish setting up your account:',
    expiry: `This code expires in ${v.minutes} minutes.`,
    footer:
      "If you didn't create an account, you can safely ignore this email.",
  }),
  'step-up-otp': v => ({
    subject: 'Your sign-in verification code',
    preview: 'Verify your sign-in',
    heading: "Verify it's you",
    greeting: `Hi ${v.name},`,
    body: 'We noticed a sign-in that needs an extra check. Enter this code to continue:',
    expiry: `This code expires in ${v.minutes} minutes.`,
    footer: "If this wasn't you, change your password immediately.",
  }),
  'new-sign-in': v => ({
    subject: 'New sign-in to your account',
    preview: 'A new device signed in',
    heading: 'New sign-in to your account',
    greeting: `Hi ${v.name},`,
    body: 'Your account was just accessed from a new device or location after verifying a one-time code.',
    whereLabel: 'Location',
    where: v.where,
    action:
      "If this wasn't you, reset your password and sign out of all devices immediately.",
    footer: 'You received this because security alerts are enabled.',
  }),
  'blocked-attempt': v => ({
    subject: 'Security alert: a sign-in attempt was blocked',
    preview: 'A sign-in was blocked',
    heading: 'A sign-in attempt was blocked',
    greeting: `Hi ${v.name},`,
    body: 'Someone entered your correct password to sign in from a new device but could not complete the additional verification, so the sign-in was blocked.',
    whereLabel: 'Attempted from',
    where: v.where,
    action:
      'Your password may be compromised — change it now and review your active sessions.',
    footer: 'You received this because security alerts are enabled.',
  }),
  'suspicious-login': v => ({
    subject: 'Security alert: suspicious sign-in activity',
    preview: 'Suspicious sign-in activity',
    heading: 'Suspicious sign-in activity',
    greeting: `Hi ${v.name},`,
    body: 'We detected repeated failed sign-in attempts on your account.',
    whereLabel: 'Detected from',
    where: v.where,
    action:
      "If this wasn't you, change your password and enable two-factor authentication.",
    footer: 'You received this because security alerts are enabled.',
  }),
  'session-compromise': v => ({
    subject: 'Security alert: unusual session activity',
    preview: 'Unusual session activity',
    heading: 'Unusual session activity',
    greeting: `Hi ${v.name},`,
    body: 'We detected a reused session token on your account and signed out all active sessions as a precaution.',
    whereLabel: 'Detected from',
    where: v.where,
    action: 'If this was not you, please reset your password immediately.',
    footer: 'You received this because security alerts are enabled.',
  }),
}

const id: CodeBuilders & AlertBuilders = {
  'verification-code': v => ({
    subject: 'Verifikasi alamat email Anda',
    preview: 'Kode verifikasi Anda',
    heading: 'Konfirmasi alamat email Anda',
    greeting: `Hai ${v.name},`,
    body: 'Gunakan kode ini untuk menyelesaikan penyiapan akun Anda:',
    expiry: `Kode ini kedaluwarsa dalam ${v.minutes} menit.`,
    footer: 'Jika Anda tidak membuat akun, abaikan email ini.',
  }),
  'step-up-otp': v => ({
    subject: 'Kode verifikasi masuk Anda',
    preview: 'Verifikasi proses masuk Anda',
    heading: 'Verifikasi bahwa ini Anda',
    greeting: `Hai ${v.name},`,
    body: 'Kami mendeteksi proses masuk yang memerlukan pemeriksaan tambahan. Masukkan kode ini untuk melanjutkan:',
    expiry: `Kode ini kedaluwarsa dalam ${v.minutes} menit.`,
    footer: 'Jika ini bukan Anda, segera ubah kata sandi Anda.',
  }),
  'new-sign-in': v => ({
    subject: 'Masuk baru ke akun Anda',
    preview: 'Perangkat baru telah masuk',
    heading: 'Masuk baru ke akun Anda',
    greeting: `Hai ${v.name},`,
    body: 'Akun Anda baru saja diakses dari perangkat atau lokasi baru setelah memverifikasi kode sekali pakai.',
    whereLabel: 'Lokasi',
    where: v.where,
    action:
      'Jika ini bukan Anda, segera ubah kata sandi dan keluarkan semua perangkat.',
    footer: 'Anda menerima ini karena peringatan keamanan diaktifkan.',
  }),
  'blocked-attempt': v => ({
    subject: 'Peringatan keamanan: upaya masuk diblokir',
    preview: 'Sebuah upaya masuk diblokir',
    heading: 'Upaya masuk diblokir',
    greeting: `Hai ${v.name},`,
    body: 'Seseorang memasukkan kata sandi Anda yang benar untuk masuk dari perangkat baru tetapi tidak dapat menyelesaikan verifikasi tambahan, sehingga upaya masuk diblokir.',
    whereLabel: 'Dicoba dari',
    where: v.where,
    action:
      'Kata sandi Anda mungkin telah bocor — segera ubah dan tinjau sesi aktif Anda.',
    footer: 'Anda menerima ini karena peringatan keamanan diaktifkan.',
  }),
  'suspicious-login': v => ({
    subject: 'Peringatan keamanan: aktivitas masuk mencurigakan',
    preview: 'Aktivitas masuk mencurigakan',
    heading: 'Aktivitas masuk mencurigakan',
    greeting: `Hai ${v.name},`,
    body: 'Kami mendeteksi beberapa upaya masuk yang gagal secara berulang pada akun Anda.',
    whereLabel: 'Terdeteksi dari',
    where: v.where,
    action:
      'Jika ini bukan Anda, ubah kata sandi dan aktifkan autentikasi dua faktor.',
    footer: 'Anda menerima ini karena peringatan keamanan diaktifkan.',
  }),
  'session-compromise': v => ({
    subject: 'Peringatan keamanan: aktivitas sesi tidak biasa',
    preview: 'Aktivitas sesi tidak biasa',
    heading: 'Aktivitas sesi tidak biasa',
    greeting: `Hai ${v.name},`,
    body: 'Kami mendeteksi token sesi yang digunakan kembali pada akun Anda dan mengeluarkan semua sesi aktif sebagai tindakan pencegahan.',
    whereLabel: 'Terdeteksi dari',
    where: v.where,
    action: 'Jika ini bukan Anda, segera ubah kata sandi Anda.',
    footer: 'Anda menerima ini karena peringatan keamanan diaktifkan.',
  }),
}

export const copy: Record<Locale, CodeBuilders & AlertBuilders> = { en, id }
