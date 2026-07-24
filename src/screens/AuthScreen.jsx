import { LockKeyhole, Mail, Phone, UserRound, Wifi, WifiOff } from 'lucide-react'
import { assets } from '../data/appData.js'

export function AuthScreen({ apiOnline, authForm, authLoading, authMode, setAuthMode, submitAuth, updateAuthField }) {
  const isRegister = authMode === 'register'

  return (
    <section className="auth-screen">
      <div className="auth-hero">
        <img src={assets.logo} alt="Rotation Barber" />
        <div className={apiOnline ? 'database-pill online' : 'database-pill'}>
          {apiOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{apiOnline ? 'BD ligada' : 'Offline'}</span>
        </div>
      </div>

      <div className="auth-copy">
        <span className="eyebrow">{isRegister ? 'Criar conta' : 'Bem-vindo'}</span>
        <h1>{isRegister ? 'Cria a tua conta Rotation.' : 'Inicia sessão para marcar.'}</h1>
        <p>As tuas marcações e favoritos ficam guardados na base de dados.</p>
      </div>

      <form className="auth-form" onSubmit={submitAuth}>
        {isRegister && (
          <label>
            <span>Nome</span>
            <div className="auth-input">
              <UserRound size={18} />
              <input
                autoComplete="name"
                value={authForm.name}
                onChange={(event) => updateAuthField('name', event.target.value)}
              />
            </div>
          </label>
        )}

        <label>
          <span>Email</span>
          <div className="auth-input">
            <Mail size={18} />
            <input
              autoComplete="email"
              inputMode="email"
              value={authForm.email}
              onChange={(event) => updateAuthField('email', event.target.value)}
            />
          </div>
        </label>

        {isRegister && (
          <label>
            <span>Telemóvel</span>
            <div className="auth-input">
              <Phone size={18} />
              <input
                autoComplete="tel"
                inputMode="tel"
                value={authForm.phone}
                onChange={(event) => updateAuthField('phone', event.target.value)}
              />
            </div>
          </label>
        )}

        <label>
          <span>Palavra-passe</span>
          <div className="auth-input">
            <LockKeyhole size={18} />
            <input
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              type="password"
              value={authForm.password}
              onChange={(event) => updateAuthField('password', event.target.value)}
            />
          </div>
        </label>

        <button className="primary-button auth-submit" disabled={authLoading} type="submit">
          {authLoading ? 'A ligar...' : isRegister ? 'Criar conta' : 'Entrar'}
        </button>
      </form>

      <button className="auth-switch" type="button" onClick={() => setAuthMode(isRegister ? 'login' : 'register')}>
        {isRegister ? 'Já tenho conta' : 'Criar conta'}
      </button>
    </section>
  )
}
