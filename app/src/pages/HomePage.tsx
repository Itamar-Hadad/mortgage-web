import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../shared/firebase'
import { onAuthStateChanged } from 'firebase/auth'

/* ─── hooks ─── */
function useCountUp(target: number, duration = 2000, start = false) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!start) return
    let raf: number
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * target))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, start])
  return val
}

function useInView(ref: React.RefObject<Element | null>, threshold = 0.25) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref, threshold])
  return inView
}

/* Attach reveal class to children when they enter viewport */
function useScrollReveal(containerRef: React.RefObject<Element | null>) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const items = container.querySelectorAll('.reveal')
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.15 })
    items.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [containerRef])
}

/* ─── Icon ─── */
function Icon({ name, filled = false, className = '', style }: { name: string; filled?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0", ...style }} aria-hidden="true">
      {name}
    </span>
  )
}

/* ─── Animated house SVG illustration ─── */
function HouseIllustration() {
  return (
    <div className="house-illustration" aria-hidden="true">
      <svg viewBox="0 0 420 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="house-svg">
        {/* Sky gradient */}
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d2448" stopOpacity="0" />
            <stop offset="100%" stopColor="#0d2448" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="houseGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00c5e8" />
            <stop offset="100%" stopColor="#0099bb" />
          </linearGradient>
          <linearGradient id="roofGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e3f80" />
            <stop offset="100%" stopColor="#0d2448" />
          </linearGradient>
          <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0f8ff" />
            <stop offset="100%" stopColor="#daeeff" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Ground */}
        <ellipse cx="210" cy="340" rx="180" ry="16" fill="rgba(0,197,232,0.15)" />

        {/* Main house body */}
        <rect x="90" y="190" width="240" height="150" rx="4" fill="url(#wallGrad)" />

        {/* Roof */}
        <polygon points="70,195 210,80 350,195" fill="url(#roofGrad)" />
        {/* Roof shine */}
        <polygon points="70,195 210,80 155,195" fill="rgba(255,255,255,0.06)" />

        {/* Chimney */}
        <rect x="270" y="105" width="24" height="50" rx="3" fill="#1e3f80" />
        {/* Smoke puffs */}
        <circle cx="282" cy="95" r="8" fill="rgba(255,255,255,0.15)" className="smoke-1" />
        <circle cx="276" cy="78" r="6" fill="rgba(255,255,255,0.1)" className="smoke-2" />
        <circle cx="286" cy="63" r="5" fill="rgba(255,255,255,0.07)" className="smoke-3" />

        {/* Front door */}
        <rect x="178" y="270" width="64" height="70" rx="4" fill="#0099bb" />
        <rect x="178" y="270" width="64" height="35" rx="4" fill="url(#houseGrad)" />
        {/* Door knob */}
        <circle cx="232" cy="307" r="4" fill="rgba(255,255,255,0.6)" />
        {/* Door arch */}
        <path d="M178 270 Q210 248 242 270" fill="rgba(255,255,255,0.08)" />

        {/* Windows */}
        {/* Left window */}
        <rect x="108" y="220" width="60" height="50" rx="4" fill="rgba(0,197,232,0.2)" stroke="rgba(0,197,232,0.4)" strokeWidth="2" />
        <line x1="138" y1="220" x2="138" y2="270" stroke="rgba(0,197,232,0.4)" strokeWidth="1.5" />
        <line x1="108" y1="245" x2="168" y2="245" stroke="rgba(0,197,232,0.4)" strokeWidth="1.5" />
        {/* Window light */}
        <rect x="110" y="222" width="26" height="21" rx="2" fill="rgba(255,255,200,0.3)" className="window-light" />

        {/* Right window */}
        <rect x="252" y="220" width="60" height="50" rx="4" fill="rgba(0,197,232,0.2)" stroke="rgba(0,197,232,0.4)" strokeWidth="2" />
        <line x1="282" y1="220" x2="282" y2="270" stroke="rgba(0,197,232,0.4)" strokeWidth="1.5" />
        <line x1="252" y1="245" x2="312" y2="245" stroke="rgba(0,197,232,0.4)" strokeWidth="1.5" />
        <rect x="254" y="222" width="26" height="21" rx="2" fill="rgba(255,255,200,0.25)" className="window-light" />

        {/* Path to door */}
        <rect x="193" y="335" width="34" height="6" rx="3" fill="rgba(0,197,232,0.3)" />
        <rect x="197" y="328" width="26" height="10" rx="3" fill="rgba(0,197,232,0.2)" />

        {/* Trees */}
        <circle cx="50" cy="265" r="28" fill="rgba(0,197,232,0.25)" />
        <circle cx="50" cy="250" r="22" fill="rgba(0,197,232,0.3)" />
        <rect x="45" y="285" width="10" height="20" rx="2" fill="rgba(0,153,187,0.4)" />

        <circle cx="370" cy="270" r="24" fill="rgba(0,197,232,0.22)" />
        <circle cx="370" cy="256" r="19" fill="rgba(0,197,232,0.28)" />
        <rect x="365" y="288" width="10" height="18" rx="2" fill="rgba(0,153,187,0.35)" />

        {/* Stars/sparkles */}
        <g filter="url(#glow)">
          <circle cx="60" cy="120" r="3" fill="#00c5e8" className="sparkle-1" />
          <circle cx="355" cy="100" r="2.5" fill="#7ae8ff" className="sparkle-2" />
          <circle cx="40" cy="170" r="2" fill="#00c5e8" className="sparkle-3" />
          <circle cx="380" cy="160" r="2" fill="#7ae8ff" className="sparkle-4" />
        </g>

        {/* Roof ridge */}
        <line x1="70" y1="195" x2="350" y2="195" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      </svg>

      {/* Floating data cards around the house */}
      <div className="house-data-card house-data-1">
        <span className="house-data-icon">💰</span>
        <div>
          <div className="house-data-val">₪85,000</div>
          <div className="house-data-lbl">חיסכון ממוצע</div>
        </div>
      </div>
      <div className="house-data-card house-data-2">
        <span className="house-data-icon">📊</span>
        <div>
          <div className="house-data-val">5 תמהילים</div>
          <div className="house-data-lbl">להשוואה</div>
        </div>
      </div>
      <div className="house-data-card house-data-3">
        <span className="house-data-icon">⚡</span>
        <div>
          <div className="house-data-val">5 דקות</div>
          <div className="house-data-lbl">לשאלון</div>
        </div>
      </div>
    </div>
  )
}

/* ─── Floating pill (hero decorative) ─── */
function FloatingPill({ label, value, style }: { label: string; value: string; style?: React.CSSProperties }) {
  return (
    <div className="floating-pill" style={style}>
      <span className="floating-pill-val">{value}</span>
      <span className="floating-pill-lbl">{label}</span>
    </div>
  )
}

/* ─── Service card ─── */
function ServiceCard({ icon, title, desc, badge, highlight, onClick, disabled }: {
  icon: string; title: string; desc: string; badge?: string; highlight?: boolean
  onClick?: () => void; disabled?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`service-card-v2 ${highlight ? 'service-card-v2--highlight' : ''}`}>
      {highlight && <div className="service-card-v2-glow" />}
      <div className={`service-card-v2-icon ${highlight ? 'service-card-v2-icon--highlight' : ''}`}>
        <Icon name={icon} filled className="text-3xl" style={{ color: '#fff' }} />
      </div>
      <h3 className="service-card-v2-title">{title}</h3>
      <p className="service-card-v2-desc">{desc}</p>
      {badge && <span className="service-badge-v2">{badge}</span>}
      {!disabled && (
        <div className="service-card-v2-cta">
          <span>התחילו עכשיו</span>
          <Icon name="arrow_back" className="text-base" />
        </div>
      )}
    </button>
  )
}

/* ─── Step ─── */
function Step({ n, icon, title, desc }: { n: number; icon: string; title: string; desc: string }) {
  return (
    <div className="step-v2 reveal">
      <div className="step-v2-num">{n}</div>
      <div className="step-v2-icon">
        <Icon name={icon} filled className="text-3xl" style={{ color: 'var(--color-primary)' }} />
      </div>
      <h4 className="step-v2-title">{title}</h4>
      <p className="step-v2-desc">{desc}</p>
    </div>
  )
}

/* ─── Stat ─── */
function Stat({ target, suffix, prefix = '', label, start }: {
  target: number; suffix: string; prefix?: string; label: string; start: boolean
}) {
  const val = useCountUp(target, 2200, start)
  return (
    <div className="stat-v2">
      <div className="stat-v2-val">{prefix}{val.toLocaleString('he-IL')}{suffix}</div>
      <div className="stat-v2-label">{label}</div>
    </div>
  )
}

/* ─── Dashboard mockup ─── */
function DashboardMockup() {
  return (
    <div className="mockup-browser reveal">
      <div className="mockup-bar">
        <div className="mockup-dots">
          <span style={{background:'#ff5f57'}} />
          <span style={{background:'#febc2e'}} />
          <span style={{background:'#28c840'}} />
        </div>
        <div className="mockup-url">simplesave-mortgage.web.app</div>
      </div>
      <div className="mockup-content">
        {/* Simulated results screen */}
        <div className="mockup-header-bar">
          <div className="mockup-logo-text">S<span>imple</span>Save</div>
          <div className="mockup-steps">
            {['נכס', 'לווים', 'הכנסות', 'הלוואות', 'תשלום', 'שעונים'].map((s, i) => (
              <div key={s} className={`mockup-step ${i < 5 ? 'done' : i === 5 ? 'active' : ''}`}>{s}</div>
            ))}
          </div>
        </div>
        <div className="mockup-results-title">5 תמהילי משכנתא להשוואה</div>
        <div className="mockup-clocks">
          {[
            { label: 'תמהיל א׳', rate: '4.1%', pay: '₪4,820', color: '#0099bb' },
            { label: 'תמהיל ב׳', rate: '4.3%', pay: '₪4,920', color: '#1e3f80' },
            { label: 'תמהיל ג׳', rate: '4.5%', pay: '₪5,100', color: '#2d628b' },
          ].map(clock => (
            <div key={clock.label} className="mockup-clock">
              <div className="mockup-clock-dial" style={{ borderColor: clock.color }}>
                <div className="mockup-clock-rate" style={{ color: clock.color }}>{clock.rate}</div>
                <div className="mockup-clock-lbl">ריבית</div>
              </div>
              <div className="mockup-clock-name">{clock.label}</div>
              <div className="mockup-clock-pay">{clock.pay}/חודש</div>
            </div>
          ))}
        </div>
        <div className="mockup-cta-row">
          <div className="mockup-btn">בחר תמהיל ← הרשמה</div>
        </div>
      </div>
    </div>
  )
}

/* ─── Testimonial ─── */
function Testimonial({ name, city, text, stars = 5 }: { name: string; city: string; text: string; stars?: number }) {
  return (
    <div className="testimonial reveal">
      <div className="testimonial-stars">{'★'.repeat(stars)}</div>
      <p className="testimonial-text">"{text}"</p>
      <div className="testimonial-author">
        <div className="testimonial-avatar">{name[0]}</div>
        <div>
          <div className="testimonial-name">{name}</div>
          <div className="testimonial-city">{city}</div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export function HomePage() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)
  const statsInView = useInView(statsRef)
  const pageRef = useRef<HTMLDivElement>(null)
  useScrollReveal(pageRef)

  useEffect(() => onAuthStateChanged(auth, u => setIsLoggedIn(!!u)), [])

  return (
    <div className="home-page" dir="rtl" ref={pageRef}>

      {/* ════ NAV ════ */}
      <nav className="home-nav">
        <a href="/" className="home-logo">
          <img src="/logo.png" alt="SimpleSave" className="home-logo-img" />
        </a>
        <div className="home-nav-links">
          <a href="#how" className="home-nav-link">איך זה עובד</a>
          <a href="#about" className="home-nav-link">אודות</a>
          <button onClick={() => navigate('/staff-sign-in')} className="home-nav-link home-nav-staff-btn"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <Icon name="admin_panel_settings" className="text-base" style={{ verticalAlign: 'middle', marginLeft: '0.3rem' }} />
            כניסת צוות
          </button>
        </div>
        <div className="home-nav-auth">
          {isLoggedIn ? (
            <button onClick={() => navigate('/personal-area')} className="btn-primary-outline">
              <Icon name="person" className="text-base" />
              האזור האישי שלי
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/sign-in')} className="btn-ghost">כניסה</button>
              <button onClick={() => navigate('/sign-up')} className="btn-primary-sm">הרשמה</button>
            </>
          )}
        </div>
      </nav>

      {/* ════ HERO ════ */}
      <section className="hero-section">
        <div className="hero-bg-mesh" />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        {/* Pills float in screen margins — hidden when viewport < 1200px */}
        <FloatingPill label="חיסכון ממוצע"   value="₪85,000" style={{ top: '22%',  right: '1.5%', animationDelay: '0s' }} />
        <FloatingPill label="לקוחות מרוצים"  value="1,200+"  style={{ top: '58%',  right: '1.5%', animationDelay: '1s' }} />
        <FloatingPill label="בנקים מובילים"  value="5"       style={{ top: '58%',  left:  '1.5%', animationDelay: '2s' }} />

        <div className="hero-inner">
          {/* Left: text */}
          <div className="hero-text-col">
            <div className="hero-badge animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <Icon name="verified" filled className="text-base" style={{ color: '#00c5e8' }} />
              ליווי מקצועי מלא — מהשאלון ועד לחתימה
            </div>

            <h1 className="hero-headline animate-fade-up" style={{ animationDelay: '0.2s' }}>
              המשכנתא שלכם,
              <br />
              <span className="hero-headline-accent">פשוטה יותר</span>
            </h1>

            <p className="hero-sub animate-fade-up" style={{ animationDelay: '0.32s' }}>
              SimpleSave מנתחת עד 5 תמהילי משכנתא, חוסכת לכם עשרות אלפי שקלים
              ומחברת אתכם ליועץ מוסמך לכל אורך הדרך.
            </p>

            <div className="hero-cta-row animate-fade-up" style={{ animationDelay: '0.44s' }}>
              <button onClick={() => navigate('/questionnaire')} className="btn-hero-primary btn-shimmer">
                <Icon name="play_arrow" filled className="text-xl" />
                התחילו — חינם לחלוטין
              </button>
              {!isLoggedIn && (
                <button onClick={() => navigate('/sign-in')} className="btn-hero-ghost">
                  כבר רשומים? כניסה
                </button>
              )}
            </div>

            <div className="hero-trust animate-fade-up" style={{ animationDelay: '0.56s' }}>
              <span>✓ ללא עלות נסתרת</span>
              <span>✓ תוצאות תוך דקות</span>
              <span>✓ מאובטח לחלוטין</span>
            </div>
          </div>

          {/* Right: house illustration */}
          <div className="hero-illus-col animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <HouseIllustration />
          </div>
        </div>

        {/* Scroll hint */}
        <div className="hero-scroll-hint">
          <div className="scroll-dot" />
          <Icon name="keyboard_arrow_down" className="text-2xl" style={{ color: 'rgba(255,255,255,0.4)' }} />
        </div>
      </section>

      {/* ════ SERVICES ════ */}
      <section className="services-section">
        <div className="section-inner">
          <div className="section-label reveal">השירותים שלנו</div>
          <h2 className="section-title reveal" style={{ animationDelay: '0.1s' }}>בחרו את הדרך שלכם</h2>
          <div className="services-grid-v2">
            <ServiceCard
              icon="home"
              title="משכנתא חדשה"
              desc="שאלון של 5 דקות, ניתוח תמהיל חכם עם 5 השוואות מקבילות וייעוץ אישי מוסמך."
              highlight
              onClick={() => navigate('/questionnaire')}
            />
            <ServiceCard
              icon="autorenew"
              title="מחזור משכנתא"
              desc="בדיקת כדאיות מחזור, ניתוח ריביות שוק עדכניות ומיחזור בתנאים אופטימליים."
              disabled
              badge="בקרוב"
            />
            <ServiceCard
              icon="shield"
              title="ביטוח משכנתא"
              desc="ביטוח חיים ורכוש בפרמיות תחרותיות מכל חברות הביטוח המובילות."
              disabled
              badge="בקרוב"
            />
          </div>
        </div>
      </section>

      {/* ════ WAVE DIVIDER ════ */}
      <div className="wave-divider-dark" aria-hidden="true">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#061628" />
        </svg>
      </div>

      {/* ════ HOW IT WORKS ════ */}
      <section id="how" className="how-section">
        <div className="section-inner">
          <div className="section-label light reveal">התהליך שלנו</div>
          <h2 className="section-title light reveal reveal-delay-1">שלושה צעדים לחיסכון</h2>
          <p className="section-sub light reveal reveal-delay-2">
            מהשאלון הראשוני ועד ליועץ האישי — הכל במקום אחד, בצורה פשוטה וברורה
          </p>

          <div className="steps-v2-grid">
            <Step n={1} icon="assignment" title="שאלון חכם" desc="ממלאים פרטים בסיסיים על הנכס, ההכנסות וההעדפות שלכם — לוקח פחות מ-5 דקות." />
            <div className="step-connector" aria-hidden="true" />
            <Step n={2} icon="analytics" title='ניתוח 5 שעונים' desc='המערכת מחשבת עד 5 תמהילי משכנתא שונים ומציגה השוואה מפורטת — ריבית, תשלום חודשי, סה"כ עלות.' />
            <div className="step-connector" aria-hidden="true" />
            <Step n={3} icon="support_agent" title="יועץ אישי" desc="יועץ מוסמך עובר על הנתונים, מאשר מסמכים ומלווה אתכם עד לחתימה על המשכנתא." />
          </div>

          <div className="reveal" style={{ textAlign: 'center', marginTop: '3rem' }}>
            <button onClick={() => navigate('/questionnaire')} className="btn-cta btn-shimmer">
              <Icon name="play_arrow" filled className="text-xl" />
              מתחילים עכשיו — חינם לחלוטין
            </button>
          </div>
        </div>
      </section>

      {/* ════ WAVE DIVIDER light ════ */}
      <div className="wave-divider-light" aria-hidden="true">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path d="M0,30 C360,0 1080,60 1440,30 L1440,0 L0,0 Z" fill="#061628" />
        </svg>
      </div>

      {/* ════ APP MOCKUP ════ */}
      <section className="mockup-section" id="about">
        <div className="mockup-section-inner">
          <div className="mockup-text-col">
            <div className="section-label reveal">איך נראה בפועל</div>
            <h2 className="section-title reveal reveal-delay-1">פלטפורמה חכמה<br />לניהול המשכנתא</h2>
            <div className="mockup-features">
              {[
                { icon: 'compare', text: 'השוואת עד 5 תמהילי משכנתא בו-זמנית' },
                { icon: 'lock', text: 'כל המסמכים מוצפנים ומאובטחים' },
                { icon: 'chat', text: 'צ׳אט ישיר עם היועץ האישי שלכם' },
                { icon: 'notifications', text: 'עדכונים בזמן אמת על מצב הבקשה' },
              ].map(f => (
                <div key={f.text} className="mockup-feature reveal">
                  <div className="mockup-feature-icon">
                    <Icon name={f.icon} filled className="text-xl" style={{ color: '#0099bb' }} />
                  </div>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mockup-screen-col">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ════ STATS ════ */}
      <section className="stats-section" ref={statsRef}>
        <div className="section-inner">
          <div className="stats-v2-grid">
            <Stat target={85000} prefix="₪" suffix="" label="חיסכון ממוצע ללקוח" start={statsInView} />
            <Stat target={1200} suffix="+" label="לקוחות מרוצים" start={statsInView} />
            <Stat target={5} suffix="" label="בנקים מובילים" start={statsInView} />
            <Stat target={98} suffix="%" label="שביעות רצון" start={statsInView} />
          </div>
        </div>
      </section>

      {/* ════ TESTIMONIALS ════ */}
      <section className="testimonials-section">
        <div className="section-inner">
          <div className="section-label reveal">מה אומרים הלקוחות</div>
          <h2 className="section-title reveal reveal-delay-1">הם כבר חסכו — עכשיו תורכם</h2>
          <div className="testimonials-grid">
            <Testimonial
              name="יעל כהן"
              city="תל אביב"
              text="חסכנו ₪92,000 על המשכנתא שלנו בזכות SimpleSave. התהליך היה פשוט ומהיר להפליא."
            />
            <Testimonial
              name="דני לוי"
              city="ראשון לציון"
              text="היועץ של SimpleSave עזר לי להבין בדיוק מה אני לוקח. שקיפות מוחלטת לאורך כל הדרך."
            />
            <Testimonial
              name="מיכל אברהם"
              city="חיפה"
              text="מהשאלון ועד לחתימה — שבועיים בלבד. לא האמנתי שאפשר להיות ככה יעיל."
            />
          </div>
        </div>
      </section>

      {/* ════ BANKS ════ */}
      <section className="banks-section-v2">
        <div className="section-inner">
          <p className="banks-title reveal">עובדים עם כל הבנקים המובילים בישראל</p>
          <div className="banks-grid-v2">
            {[
              { name: 'בנק הפועלים', icon: 'account_balance' },
              { name: 'בנק לאומי', icon: 'account_balance' },
              { name: 'מזרחי טפחות', icon: 'account_balance' },
              { name: 'בנק דיסקונט', icon: 'account_balance' },
              { name: 'הבינלאומי', icon: 'account_balance' },
            ].map((bank, i) => (
              <div key={bank.name} className="bank-chip-v2 reveal" style={{ transitionDelay: `${i * 0.07}s` }}>
                <Icon name={bank.icon} filled className="text-lg" style={{ color: 'var(--color-primary)' }} />
                {bank.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ FINAL CTA ════ */}
      <section className="final-cta-section">
        <div className="final-cta-orb-1" />
        <div className="final-cta-orb-2" />
        <div className="section-inner" style={{ position: 'relative', zIndex: 2 }}>
          <div className="final-cta-icon reveal">
            <Icon name="home" filled className="text-5xl" style={{ color: '#fff' }} />
          </div>
          <h2 className="section-title light reveal reveal-delay-1"
            style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', maxWidth: 620, margin: '1.5rem auto 1rem' }}>
            מוכנים לחסוך על המשכנתא שלכם?
          </h2>
          <p className="section-sub light reveal reveal-delay-2" style={{ maxWidth: 460, margin: '0 auto 2.5rem' }}>
            הצטרפו לאלפי לקוחות שכבר חסכו עשרות אלפי שקלים עם SimpleSave
          </p>
          <div className="cta-buttons reveal reveal-delay-3">
            <button onClick={() => navigate('/questionnaire')} className="btn-cta btn-cta-white btn-shimmer">
              <Icon name="arrow_back" className="text-lg" />
              התחילו את הסימולטור
            </button>
            {!isLoggedIn && (
              <button onClick={() => navigate('/sign-up')} className="btn-cta btn-cta-outline">
                הרשמה לאזור האישי
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer className="home-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/logo.png" alt="SimpleSave" className="footer-logo-img" />
            <p className="footer-tagline">לחסוך מחוץ לקופסא</p>
          </div>
          <div className="footer-links">
            <a href="#how">איך זה עובד</a>
            <a href="#about">אודות</a>
            <span onClick={() => navigate('/sign-in')} style={{ cursor: 'pointer' }}>כניסה למערכת</span>
            <span onClick={() => navigate('/sign-up')} style={{ cursor: 'pointer' }}>הרשמה</span>
          </div>
          <div className="footer-copy">© {new Date().getFullYear()} SimpleSave. כל הזכויות שמורות.</div>
        </div>
      </footer>
    </div>
  )
}
