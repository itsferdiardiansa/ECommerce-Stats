export type Locale = 'en' | 'id'

export interface CodeVars {
  name: string
  code: string
  minutes: number
}

export interface LinkVars {
  name: string
  url: string
  minutes: number
}

export interface LinkStrings {
  subject: string
  preview: string
  heading: string
  greeting: string
  body: string
  buttonLabel: string
  expiry: string
  fallback: string
  footer: string
}

export type SecurityMethod = 'totp' | 'passkey' | 'trusted_device'

export interface MethodVars {
  name: string
  method: SecurityMethod
  /** ISO timestamp of the change. */
  at: string
  device: string | null
  location: string | null
}

export interface AlertVars {
  name: string
  device: string | null
  location: string | null
  ip: string | null
  secureUrl?: string
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
  deviceLabel: string
  device: string | null
  locationLabel: string
  location: string | null
  ipLabel: string
  ip: string | null
  secureLabel: string
  action: string
  footer: string
}

export interface MethodStrings {
  subject: string
  preview: string
  heading: string
  greeting: string
  body: string
  methodName: string
  methodNote: string
  whenLabel: string
  when: string
  fromLabel: string
  from: string | null
  action: string
  actionTone: 'neutral' | 'warning'
  footer: string
}

type CodeName = 'verification-code' | 'step-up-otp' | 'email-change'
type LinkName = 'password-reset' | 'staff-invite' | 'staff-totp-reset'
type MethodName = 'security-method-enabled' | 'security-method-disabled'
type AlertName =
  | 'new-sign-in'
  | 'blocked-attempt'
  | 'suspicious-login'
  | 'session-compromise'
  | 'password-changed'
  | 'recovery-code-used'

type CodeBuilders = Record<CodeName, (v: CodeVars) => CodeStrings>
type MethodBuilders = Record<MethodName, (v: MethodVars) => MethodStrings>
type AlertBuilders = Record<AlertName, (v: AlertVars) => AlertStrings>
type LinkBuilders = Record<LinkName, (v: LinkVars) => LinkStrings>

const enLink: LinkBuilders = {
  'password-reset': v => ({
    subject: 'Reset your password',
    preview: 'Reset your password',
    heading: 'Reset your password',
    greeting: `Hi ${v.name},`,
    body: 'We received a request to reset your password. Click the button below to choose a new one.',
    buttonLabel: 'Reset password',
    expiry: `This link expires in ${v.minutes} minutes and can be used once.`,
    fallback: 'If the button does not work, paste this link into your browser:',
    footer:
      "If you didn't request this, you can safely ignore this email - your password won't change.",
  }),
  'staff-invite': v => ({
    subject: 'You have been invited to Rufieltics Admin',
    preview: 'Set up your staff account',
    heading: 'You have been invited',
    greeting: `Hi ${v.name},`,
    body: 'You have been invited to the Rufieltics platform admin console. Set your password and enrol your authenticator app to get started.',
    buttonLabel: 'Set up your account',
    expiry: `This invite expires in ${Math.round(v.minutes / 1440)} days and can be used once.`,
    fallback: 'If the button does not work, paste this link into your browser:',
    footer:
      "If you weren't expecting this invitation, you can safely ignore this email.",
  }),
  'staff-totp-reset': v => ({
    subject: 'Reset your authenticator',
    preview: 'Set up a new authenticator app',
    heading: 'Reset your authenticator',
    greeting: `Hi ${v.name},`,
    body: 'We received a request to reset the authenticator (2FA) on your admin account. Click below to scan a new QR code and confirm a fresh 6-digit code.',
    buttonLabel: 'Reset authenticator',
    expiry: `This link expires in ${Math.round(v.minutes / 1)} minutes and can be used once.`,
    fallback: 'If the button does not work, paste this link into your browser:',
    footer:
      "If you didn't request this, ignore this email - your current authenticator keeps working.",
  }),
}

const idLink: LinkBuilders = {
  'password-reset': v => ({
    subject: 'Atur ulang kata sandi Anda',
    preview: 'Atur ulang kata sandi Anda',
    heading: 'Atur ulang kata sandi Anda',
    greeting: `Hai ${v.name},`,
    body: 'Kami menerima permintaan untuk mengatur ulang kata sandi Anda. Klik tombol di bawah untuk memilih yang baru.',
    buttonLabel: 'Atur ulang kata sandi',
    expiry: `Tautan ini kedaluwarsa dalam ${v.minutes} menit dan hanya dapat digunakan sekali.`,
    fallback:
      'Jika tombol tidak berfungsi, tempel tautan ini ke peramban Anda:',
    footer:
      'Jika Anda tidak meminta ini, abaikan email ini - kata sandi Anda tidak akan berubah.',
  }),
  'staff-invite': v => ({
    subject: 'Anda diundang ke Rufieltics Admin',
    preview: 'Siapkan akun staf Anda',
    heading: 'Anda telah diundang',
    greeting: `Hai ${v.name},`,
    body: 'Anda diundang ke konsol admin platform Rufieltics. Atur kata sandi dan daftarkan aplikasi autentikator Anda untuk memulai.',
    buttonLabel: 'Siapkan akun Anda',
    expiry: `Undangan ini kedaluwarsa dalam ${Math.round(v.minutes / 1440)} hari dan hanya dapat digunakan sekali.`,
    fallback:
      'Jika tombol tidak berfungsi, tempel tautan ini ke peramban Anda:',
    footer:
      'Jika Anda tidak mengharapkan undangan ini, abaikan email ini dengan aman.',
  }),
  'staff-totp-reset': v => ({
    subject: 'Atur ulang autentikator Anda',
    preview: 'Siapkan aplikasi autentikator baru',
    heading: 'Atur ulang autentikator Anda',
    greeting: `Hai ${v.name},`,
    body: 'Kami menerima permintaan untuk mengatur ulang autentikator (2FA) pada akun admin Anda. Klik di bawah untuk memindai kode QR baru dan mengonfirmasi kode 6 digit yang baru.',
    buttonLabel: 'Atur ulang autentikator',
    expiry: `Tautan ini kedaluwarsa dalam ${Math.round(v.minutes / 1)} menit dan hanya dapat digunakan sekali.`,
    fallback:
      'Jika tombol tidak berfungsi, tempel tautan ini ke peramban Anda:',
    footer:
      'Jika Anda tidak meminta ini, abaikan email ini - autentikator Anda saat ini tetap berfungsi.',
  }),
}

const enLabels = {
  deviceLabel: 'Device',
  locationLabel: 'Approximate location',
  ipLabel: 'IP address',
  secureLabel: "This wasn't me - secure my account",
}
const idLabels = {
  deviceLabel: 'Perangkat',
  locationLabel: 'Perkiraan lokasi',
  ipLabel: 'Alamat IP',
  secureLabel: 'Ini bukan saya - amankan akun saya',
}

const enMethodNames: Record<SecurityMethod, string> = {
  totp: 'Authenticator app',
  passkey: 'Passkey',
  trusted_device: 'Trusted browser',
}
const enMethodNotes: Record<SecurityMethod, string> = {
  totp: 'Time-based one-time codes from your authenticator app.',
  passkey: 'Sign in with your fingerprint, face or screen lock.',
  trusted_device: 'This browser can skip the sign-in code for a while.',
}
const idMethodNames: Record<SecurityMethod, string> = {
  totp: 'Aplikasi autentikator',
  passkey: 'Passkey',
  trusted_device: 'Peramban tepercaya',
}
const idMethodNotes: Record<SecurityMethod, string> = {
  totp: 'Kode sekali pakai berbasis waktu dari aplikasi autentikator Anda.',
  passkey: 'Masuk dengan sidik jari, wajah, atau kunci layar Anda.',
  trusted_device: 'Peramban ini dapat melewati kode masuk untuk sementara.',
}

const formatWhen = (iso: string, locale: Locale): string =>
  new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(iso)) + ' UTC'

const joinFrom = (v: MethodVars): string | null =>
  [v.device, v.location].filter(Boolean).join(' - ') || null

const enDetails = (v: AlertVars) => ({
  ...enLabels,
  device: v.device,
  location: v.location,
  ip: v.ip,
})
const idDetails = (v: AlertVars) => ({
  ...idLabels,
  device: v.device,
  location: v.location,
  ip: v.ip,
})

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
  'email-change': v => ({
    subject: 'Confirm your new email address',
    preview: 'Confirm your new email',
    heading: 'Confirm your new email address',
    greeting: `Hi ${v.name},`,
    body: 'Use this code to confirm this email address for your account:',
    expiry: `This code expires in ${v.minutes} minutes.`,
    footer: "If you didn't request this change, you can ignore this email.",
  }),
  'new-sign-in': v => ({
    subject: 'New sign-in to your account',
    preview: 'A new device signed in',
    heading: 'New sign-in to your account',
    greeting: `Hi ${v.name},`,
    body: 'Your account was just accessed from a new device after verifying a one-time code:',
    ...enDetails(v),
    action:
      "If this wasn't you, reset your password and sign out of all devices immediately.",
    footer: 'You received this because security alerts are enabled.',
  }),
  'blocked-attempt': v => ({
    subject: 'Security alert: a sign-in attempt was blocked',
    preview: 'A sign-in was blocked',
    heading: 'A sign-in attempt was blocked',
    greeting: `Hi ${v.name},`,
    body: 'Someone entered your correct password from a new device but could not complete verification, so the sign-in was blocked:',
    ...enDetails(v),
    action:
      'Your password may be compromised - change it now and review your active sessions.',
    footer: 'You received this because security alerts are enabled.',
  }),
  'suspicious-login': v => ({
    subject: 'Security alert: suspicious sign-in activity',
    preview: 'Suspicious sign-in activity',
    heading: 'Suspicious sign-in activity',
    greeting: `Hi ${v.name},`,
    body: 'We detected repeated failed sign-in attempts on your account:',
    ...enDetails(v),
    action:
      "If this wasn't you, change your password and enable two-factor authentication.",
    footer: 'You received this because security alerts are enabled.',
  }),
  'session-compromise': v => ({
    subject: 'Security alert: unusual session activity',
    preview: 'Unusual session activity',
    heading: 'Unusual session activity',
    greeting: `Hi ${v.name},`,
    body: 'We detected a reused session token and signed out all active sessions as a precaution:',
    ...enDetails(v),
    action: 'If this was not you, please reset your password immediately.',
    footer: 'You received this because security alerts are enabled.',
  }),
  'password-changed': v => ({
    subject: 'Your password was changed',
    preview: 'Your password was changed',
    heading: 'Your password was changed',
    greeting: `Hi ${v.name},`,
    body: 'The password for your account was just changed, and all other devices were signed out:',
    ...enDetails(v),
    action:
      "If you didn't do this, reset your password immediately and review your active sessions.",
    footer: 'You received this because security alerts are enabled.',
  }),
  'recovery-code-used': v => ({
    subject: 'A recovery code was used to sign in',
    preview: 'A recovery code was used',
    heading: 'A recovery code was used',
    greeting: `Hi ${v.name},`,
    body: 'Someone signed in using one of your recovery codes instead of your authenticator app. That code is now used up:',
    ...enDetails(v),
    action:
      "If this wasn't you, change your password and regenerate your recovery codes immediately.",
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
  'email-change': v => ({
    subject: 'Konfirmasi alamat email baru Anda',
    preview: 'Konfirmasi email baru Anda',
    heading: 'Konfirmasi alamat email baru Anda',
    greeting: `Hai ${v.name},`,
    body: 'Gunakan kode ini untuk mengonfirmasi alamat email ini untuk akun Anda:',
    expiry: `Kode ini kedaluwarsa dalam ${v.minutes} menit.`,
    footer: 'Jika Anda tidak meminta perubahan ini, abaikan email ini.',
  }),
  'new-sign-in': v => ({
    subject: 'Masuk baru ke akun Anda',
    preview: 'Perangkat baru telah masuk',
    heading: 'Masuk baru ke akun Anda',
    greeting: `Hai ${v.name},`,
    body: 'Akun Anda baru saja diakses dari perangkat baru setelah memverifikasi kode sekali pakai:',
    ...idDetails(v),
    action:
      'Jika ini bukan Anda, segera ubah kata sandi dan keluarkan semua perangkat.',
    footer: 'Anda menerima ini karena peringatan keamanan diaktifkan.',
  }),
  'blocked-attempt': v => ({
    subject: 'Peringatan keamanan: upaya masuk diblokir',
    preview: 'Sebuah upaya masuk diblokir',
    heading: 'Upaya masuk diblokir',
    greeting: `Hai ${v.name},`,
    body: 'Seseorang memasukkan kata sandi Anda yang benar dari perangkat baru tetapi tidak dapat menyelesaikan verifikasi, sehingga upaya masuk diblokir:',
    ...idDetails(v),
    action:
      'Kata sandi Anda mungkin telah bocor - segera ubah dan tinjau sesi aktif Anda.',
    footer: 'Anda menerima ini karena peringatan keamanan diaktifkan.',
  }),
  'suspicious-login': v => ({
    subject: 'Peringatan keamanan: aktivitas masuk mencurigakan',
    preview: 'Aktivitas masuk mencurigakan',
    heading: 'Aktivitas masuk mencurigakan',
    greeting: `Hai ${v.name},`,
    body: 'Kami mendeteksi beberapa upaya masuk yang gagal secara berulang pada akun Anda:',
    ...idDetails(v),
    action:
      'Jika ini bukan Anda, ubah kata sandi dan aktifkan autentikasi dua faktor.',
    footer: 'Anda menerima ini karena peringatan keamanan diaktifkan.',
  }),
  'session-compromise': v => ({
    subject: 'Peringatan keamanan: aktivitas sesi tidak biasa',
    preview: 'Aktivitas sesi tidak biasa',
    heading: 'Aktivitas sesi tidak biasa',
    greeting: `Hai ${v.name},`,
    body: 'Kami mendeteksi token sesi yang digunakan kembali dan mengeluarkan semua sesi aktif sebagai tindakan pencegahan:',
    ...idDetails(v),
    action: 'Jika ini bukan Anda, segera ubah kata sandi Anda.',
    footer: 'Anda menerima ini karena peringatan keamanan diaktifkan.',
  }),
  'password-changed': v => ({
    subject: 'Kata sandi Anda telah diubah',
    preview: 'Kata sandi Anda telah diubah',
    heading: 'Kata sandi Anda telah diubah',
    greeting: `Hai ${v.name},`,
    body: 'Kata sandi akun Anda baru saja diubah, dan semua perangkat lain telah dikeluarkan:',
    ...idDetails(v),
    action:
      'Jika ini bukan Anda, segera atur ulang kata sandi dan tinjau sesi aktif Anda.',
    footer: 'Anda menerima ini karena peringatan keamanan diaktifkan.',
  }),
  'recovery-code-used': v => ({
    subject: 'Kode pemulihan digunakan untuk masuk',
    preview: 'Kode pemulihan digunakan',
    heading: 'Kode pemulihan digunakan',
    greeting: `Hai ${v.name},`,
    body: 'Seseorang masuk menggunakan salah satu kode pemulihan Anda, bukan aplikasi autentikator. Kode tersebut kini sudah terpakai:',
    ...idDetails(v),
    action:
      'Jika ini bukan Anda, segera ubah kata sandi dan buat ulang kode pemulihan Anda.',
    footer: 'Anda menerima ini karena peringatan keamanan diaktifkan.',
  }),
}

const enMethod: MethodBuilders = {
  'security-method-enabled': v => ({
    subject: `${enMethodNames[v.method]} added to your account`,
    preview: `${enMethodNames[v.method]} added`,
    heading: `${enMethodNames[v.method]} added`,
    greeting: `Hi ${v.name},`,
    body: 'This security method was just added to your account and can now be used to sign in.',
    methodName: enMethodNames[v.method],
    methodNote: enMethodNotes[v.method],
    whenLabel: 'When:',
    when: formatWhen(v.at, 'en'),
    fromLabel: 'From:',
    from: joinFrom(v),
    action:
      "If you didn't add this, remove it and change your password right away.",
    actionTone: 'neutral',
    footer: 'You received this because security alerts are enabled.',
  }),
  'security-method-disabled': v => ({
    subject: `${enMethodNames[v.method]} removed from your account`,
    preview: `${enMethodNames[v.method]} removed`,
    heading: `${enMethodNames[v.method]} removed`,
    greeting: `Hi ${v.name},`,
    body: 'This security method was just removed and can no longer be used to sign in.',
    methodName: enMethodNames[v.method],
    methodNote: enMethodNotes[v.method],
    whenLabel: 'When:',
    when: formatWhen(v.at, 'en'),
    fromLabel: 'From:',
    from: joinFrom(v),
    action:
      "If you didn't remove this, change your password now - your account may be compromised.",
    actionTone: 'warning',
    footer: 'You received this because security alerts are enabled.',
  }),
}

const idMethod: MethodBuilders = {
  'security-method-enabled': v => ({
    subject: `${idMethodNames[v.method]} ditambahkan ke akun Anda`,
    preview: `${idMethodNames[v.method]} ditambahkan`,
    heading: `${idMethodNames[v.method]} ditambahkan`,
    greeting: `Hai ${v.name},`,
    body: 'Metode keamanan ini baru saja ditambahkan ke akun Anda dan kini dapat digunakan untuk masuk.',
    methodName: idMethodNames[v.method],
    methodNote: idMethodNotes[v.method],
    whenLabel: 'Waktu:',
    when: formatWhen(v.at, 'id'),
    fromLabel: 'Dari:',
    from: joinFrom(v),
    action:
      'Jika ini bukan Anda, hapus metode tersebut dan segera ubah kata sandi Anda.',
    actionTone: 'neutral',
    footer: 'Anda menerima ini karena peringatan keamanan diaktifkan.',
  }),
  'security-method-disabled': v => ({
    subject: `${idMethodNames[v.method]} dihapus dari akun Anda`,
    preview: `${idMethodNames[v.method]} dihapus`,
    heading: `${idMethodNames[v.method]} dihapus`,
    greeting: `Hai ${v.name},`,
    body: 'Metode keamanan ini baru saja dihapus dan tidak dapat lagi digunakan untuk masuk.',
    methodName: idMethodNames[v.method],
    methodNote: idMethodNotes[v.method],
    whenLabel: 'Waktu:',
    when: formatWhen(v.at, 'id'),
    fromLabel: 'Dari:',
    from: joinFrom(v),
    action:
      'Jika ini bukan Anda, segera ubah kata sandi Anda - akun Anda mungkin telah disusupi.',
    actionTone: 'warning',
    footer: 'Anda menerima ini karena peringatan keamanan diaktifkan.',
  }),
}

export const copy: Record<Locale, CodeBuilders & AlertBuilders> = { en, id }
export const methodCopy: Record<Locale, MethodBuilders> = {
  en: enMethod,
  id: idMethod,
}
export const linkCopy: Record<Locale, LinkBuilders> = {
  en: enLink,
  id: idLink,
}
