import { lazy, Suspense, useState } from 'react'

const ThePathExperience = lazy(() => import('./experiences/the-path/ThePathExperience'))
const TheParticularExperience = lazy(
  () => import('./experiences/the-particular/TheParticularExperience'),
)

type ExperienceId = 'the-path' | 'the-particular'

const EXPERIENCES: { id: ExperienceId; label: string }[] = [
  { id: 'the-path', label: 'The Path' },
  { id: 'the-particular', label: 'The Particular' },
]

export default function App() {
  const [active, setActive] = useState<ExperienceId>('the-path')

  return (
    <div className="app-shell">
      <nav
        className={`experience-menu${active === 'the-particular' ? ' on-dark' : ''}`}
        aria-label="Select piece"
      >
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
        {active === 'the-path' ? (
          <ThePathExperience key="the-path" />
        ) : (
          <TheParticularExperience key="the-particular" />
        )}
      </Suspense>
    </div>
  )
}
