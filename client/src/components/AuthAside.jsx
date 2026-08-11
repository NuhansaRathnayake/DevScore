const COPY = {
  login: {
    eyebrow: 'Evidence, not assertions',
    title: 'Turn your GitHub into proof recruiters trust.',
    lead: 'DevScore reads your resume, mines your public repositories, and turns real, shipped work into a transparent 0–100 readiness score.',
    points: [
      'Only your public repositories are analysed.',
      'Every score is explainable, down to the commits.',
      'Your score stays private until you share it.',
    ],
  },
  signup: {
    eyebrow: 'Four steps, a few minutes',
    title: 'Make your resume undeniable.',
    lead: 'Upload a resume, connect a public GitHub account, and get an evidence-backed readiness score you can put in front of any recruiter.',
    points: [
      'Free to create — no card, no trial.',
      'Skills matched against real repository evidence.',
      'A shareable breakdown recruiters actually trust.',
    ],
  },
};

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12l5 5 9-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AuthAside({ variant = 'login' }) {
  const copy = COPY[variant] || COPY.login;

  return (
    <aside className="auth-aside">
      <span className="auth-aside__decor auth-aside__decor--1" aria-hidden="true" />
      <span className="auth-aside__decor auth-aside__decor--2" aria-hidden="true" />
      <div className="auth-aside__inner">
        <span className="auth-aside__eyebrow">{copy.eyebrow}</span>
        <h2 className="auth-aside__title">{copy.title}</h2>
        <p className="auth-aside__lead">{copy.lead}</p>
        <ul className="auth-aside__points">
          {copy.points.map((point) => (
            <li key={point}>
              <span className="auth-aside__check"><CheckIcon /></span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
