import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { useAuth, ROLE_HOME } from '../context/AuthContext.jsx';

const FEATURES = [
  {
    title: 'Resume Skill Extraction',
    body: 'An NLP module reads each uploaded resume and pulls out a structured set of claimed languages, frameworks and tools.',
  },
  {
    title: 'GitHub Evidence Mining',
    body: 'We mine public repositories, languages, commits and contribution history to see what a candidate has actually shipped.',
  },
  {
    title: 'Weighted Readiness Score',
    body: 'A weighted scoring engine cross-references claims against evidence to produce a single, explainable 0-100 score.',
  },
  {
    title: 'Evidence Gap Dashboard',
    body: 'Recruiters get a clear breakdown of verified vs. unverified skills instead of a resume they have to take on faith.',
  },
];

const STEPS = [
  { step: '01', title: 'Sign in with Google', body: 'No passwords. Students and recruiters sign up in one click.' },
  { step: '02', title: 'Connect & Upload', body: 'Students connect a public GitHub account and upload a resume.' },
  { step: '03', title: 'We Verify', body: 'Claimed skills are matched against real repository evidence.' },
  { step: '04', title: 'Recruiters Decide', body: 'Recruiters view the readiness score and evidence-gap breakdown.' },
];

export default function Home() {
  const { user, status } = useAuth();
  const isAuthed = status === 'authed' && user;
  const dashboardHref = isAuthed ? ROLE_HOME[user.role] || '/student' : '/login';

  return (
    <div className="landing">
      <header className="landing-nav">
        <Logo showText />
        <nav className="landing-nav__links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
        </nav>
        <Link to={dashboardHref} className="btn-primary landing-nav__cta">
          {isAuthed ? 'Go to Dashboard' : 'Login'}
        </Link>
      </header>

      <main>
        <section className="landing-hero">
          <span className="landing-hero__eyebrow">AI-Driven Job Readiness Scoring</span>
          <h1>
            Stop guessing who can actually code.
            <br />
            Start verifying it.
          </h1>
          <p className="landing-hero__lead">
            DevScore cross-references what a candidate says they can do on their
            resume against what they have demonstrably built on GitHub &mdash;
            giving recruiters a transparent, evidence-backed readiness score
            instead of a gut feeling.
          </p>
          <div className="landing-hero__actions">
            <Link to={dashboardHref} className="btn-primary">
              {isAuthed ? 'Go to Dashboard' : 'Get Started'}
            </Link>
            <a href="#how-it-works" className="btn-secondary">
              See how it works
            </a>
          </div>
        </section>

        <section id="features" className="landing-section">
          <h2>Everything recruiters need to trust a resume</h2>
          <p className="landing-section__lead">
            Built to close the &ldquo;Verification Gap&rdquo; between
            self-reported skills and real, inspectable evidence.
          </p>
          <div className="landing-grid">
            {FEATURES.map((f) => (
              <div className="landing-card card" key={f.title}>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="landing-section landing-section--muted">
          <h2>How it works</h2>
          <div className="landing-steps">
            {STEPS.map((s) => (
              <div className="landing-step" key={s.step}>
                <span className="landing-step__num">{s.step}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="about" className="landing-section landing-cta">
          <h2>Evidence-backed hiring starts here</h2>
          <p className="landing-section__lead">
            Only public repositories are analysed, student scores stay
            private to recruiters, and every score is explainable.
          </p>
          <Link to={dashboardHref} className="btn-primary landing-cta__btn">
            {isAuthed ? 'Go to Dashboard' : 'Sign in with Google'}
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <Logo size={22} showText />
        <span className="muted">&copy; {new Date().getFullYear()} DevScore &mdash; Team ScriptFusion</span>
      </footer>
    </div>
  );
}
