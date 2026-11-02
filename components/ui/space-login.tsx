'use client';

import { forwardRef, useState, type CSSProperties, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, LayoutDashboard, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import FinanceIllustration from './finance-illustration';
import styles from './space-login.module.css';

export type GlassVariant = 'subtle' | 'default' | 'bold';
export type AuthMode = 'signin' | 'signup';

export interface GlassProps {
  children: ReactNode;
  variant?: GlassVariant;
  className?: string;
  style?: CSSProperties;
}

// The supplied SpaceLogin's glass treatment, adapted to the app's neutral tokens.
// CSS backdrop blur also works in browsers without SVG displacement filters.
export function Glass({ children, variant = 'default', className, style }: GlassProps) {
  return <div className={cn(styles.glass, styles[variant], className)} style={style}>{children}</div>;
}

export interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  rightElement?: ReactNode;
  variant?: GlassVariant;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(function GlassInput(
  { icon, rightElement, variant, className, ...props }, ref,
) {
  return (
    <Glass variant={variant} className={styles.inputShell}>
      {icon && <span className={styles.inputIcon} aria-hidden="true">{icon}</span>}
      <input {...props} ref={ref} className={cn(styles.input, icon && styles.withIcon, rightElement && styles.withAction, className)} />
      {rightElement && <span className={styles.inputAction}>{rightElement}</span>}
    </Glass>
  );
});

export interface SpaceLoginProps {
  brand?: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  defaultEmail?: string;
  glassVariant?: GlassVariant;
  onSubmit: (data: { email: string; password: string; mode: AuthMode }) => Promise<{ message?: string } | void>;
  onDemo?: () => void;
}

const stars = Array.from({ length: 48 }, (_, index) => ({
  left: `${(index * 37 + 11) % 100}%`,
  top: `${(index * 23 + 7) % 100}%`,
  opacity: .12 + (index % 4) * .045,
  width: index % 9 === 0 ? 2 : 1,
  height: index % 9 === 0 ? 2 : 1,
}));

export function SpaceLogin({ brand, title, subtitle, className, defaultEmail = '', glassVariant = 'default', onSubmit, onDemo }: SpaceLoginProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const reducedMotion = useReducedMotion();

  function changeMode() {
    setMode(current => current === 'signin' ? 'signup' : 'signin');
    setShowPassword(false);
    setError('');
    setMessage('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (working) return;
    setWorking(true);
    setError('');
    setMessage('');
    try {
      const result = await onSubmit({ email: email.trim(), password, mode });
      if (result?.message) setMessage(result.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível acessar sua conta. Tente novamente.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className={cn(styles.page, className)}>
      <div className={styles.atmosphere} aria-hidden="true">
        <div className={styles.starfield}>{stars.map((star, index) => <i key={index} style={star} />)}</div>
        <div className={styles.horizon} />
        <div className={styles.horizonLine} />
      </div>

      <header className={styles.header}>
        {brand}
        <span className={styles.headerNote}><LockKeyhole size={13} aria-hidden="true" /> Seu espaço financeiro pessoal</span>
      </header>

      <div className={styles.stage}>
        <aside className={styles.illustration} aria-hidden="true">
          <FinanceIllustration />
          <p>Mais clareza para<br /><span>cada escolha.</span></p>
        </aside>

        <motion.section
          className={cn(styles.formPanel, 'w-full min-w-0')}
          aria-labelledby="space-login-title"
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : .45, ease: 'easeOut' }}
        >
          <div className={styles.intro}>
            <h1 id="space-login-title">{mode === 'signin' ? title || 'Entre na sua conta.' : 'Dê espaço aos seus planos.'}</h1>
            <p>{mode === 'signin' ? subtitle || 'Suas finanças organizadas. Sua vida mais leve.' : 'Crie sua conta e comece a cuidar do que vem a seguir.'}</p>
          </div>

          <form onSubmit={submit} className={styles.form} aria-busy={working}>
            <div className={styles.field}>
              <label htmlFor="space-email">E-mail</label>
              <GlassInput id="space-email" name="email" type="email" required autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="voce@exemplo.com" value={email} onChange={event => setEmail(event.target.value)} variant={glassVariant} icon={<Mail size={18} strokeWidth={1.6} />} disabled={working} />
            </div>
            <div className={styles.field}>
              <div className={styles.labelRow}><label htmlFor="space-password">Senha</label>{mode === 'signup' && <span id="space-password-hint">Mínimo de 8 caracteres</span>}</div>
              <GlassInput
                id="space-password" name="password" type={showPassword ? 'text' : 'password'} required minLength={8}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                aria-describedby={mode === 'signup' ? 'space-password-hint' : undefined}
                placeholder={mode === 'signin' ? 'Digite sua senha' : 'Crie uma senha segura'}
                value={password} onChange={event => setPassword(event.target.value)} variant={glassVariant}
                icon={<LockKeyhole size={18} strokeWidth={1.6} />} disabled={working}
                rightElement={<button className={styles.passwordToggle} type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} aria-controls="space-password">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
              />
            </div>

            {error && <div className={styles.error} role="alert">{error}</div>}
            {message && <div className={styles.confirmation} role="status">{message}</div>}

            <motion.button className={styles.submit} type="submit" disabled={working} whileTap={reducedMotion ? undefined : { scale: .99 }}>
              {working ? <><LoaderCircle className={styles.spinner} size={17} aria-hidden="true" />Aguarde…</> : <>{mode === 'signin' ? 'Entrar na conta' : 'Criar minha conta'}<ArrowRight size={17} aria-hidden="true" /></>}
            </motion.button>
          </form>

          <p className={styles.modeSwitch}>{mode === 'signin' ? 'Ainda não tem uma conta?' : 'Já tem uma conta?'} <button type="button" onClick={changeMode} disabled={working}>{mode === 'signin' ? 'Criar conta' : 'Entrar'}</button></p>

          {onDemo && <>
            <div className={styles.divider}><span>ou conheça primeiro</span></div>
            <button className={styles.demo} type="button" onClick={onDemo} disabled={working}><LayoutDashboard size={16} aria-hidden="true" />Explorar demonstração</button>
            <p className={styles.demoNote}>Dados fictícios. Nenhuma conta necessária.</p>
          </>}
          <div className={styles.privacy}><LockKeyhole size={12} aria-hidden="true" /><span>Seus dados são privados e protegidos por conta.</span></div>
        </motion.section>
      </div>

      <footer className={styles.footer}><span>© {new Date().getFullYear()} Gestão Finance</span><span>Clareza para suas finanças.</span></footer>
    </main>
  );
}

export default SpaceLogin;
