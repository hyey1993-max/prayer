import { lazy, Suspense, useState } from 'react'

const ThePathExperience = lazy(() => import('./experiences/the-path/ThePathExperience'))
const TheParticularExperience = lazy(
  () => import('./experiences/the-particular/TheParticularExperience'),
)
const TheIThatEmergesExperience = lazy(
  () => import('./experiences/the-i-that-emerges/TheIThatEmergesExperience'),
)
const OscillationExperience = lazy(() => import('./experiences/oscillation/OscillationExperience'))

type ExperienceId = 'the-path' | 'the-particular' | 'the-i-that-emerges' | 'oscillation'

const EXPERIENCES: { id: ExperienceId; label: string }[] = [
  { id: 'the-path', label: 'The Path' },
  { id: 'the-particular', label: 'The Particular' },
  { id: 'the-i-that-emerges', label: 'The I That Emerges' },
  { id: 'oscillation', label: 'Oscillation' },
]

// Pieces with a fixed ground of their own, regardless of system theme.
const MENU_TONE: Partial<Record<ExperienceId, string>> = {
  'the-particular': ' on-dark',
  'the-i-that-emerges': ' on-dark',
  oscillation: ' on-dark',
}

export default function App() {
  const [active, setActive] = useState<ExperienceId>('the-path')

  return (
    <div className="app-shell">
      <nav className={`experience-menu${MENU_TONE[active] ?? ''}`} aria-label="Select piece">
        {EXPERIENCES.map((exp) => (
          <button
            key={exp.id}
            type="button"
            className={exp.id === active ? 'is-active' : ''}
            onClick={() => setActive(exp.id)}
            aria-current={exp.id === active}
          >
            {exp.label}
          </button>
        ))}
      </nav>

      <Suspense fallback={null}>
        {active === 'the-path' && <ThePathExperience key="the-path" />}
        {active === 'the-particular' && <TheParticularExperience key="the-particular" />}
        {active === 'the-i-that-emerges' && <TheIThatEmergesExperience key="the-i-that-emerges" />}
        {active === 'oscillation' && <OscillationExperience key="oscillation" />}
      </Suspense>
    </div>
  )
}
