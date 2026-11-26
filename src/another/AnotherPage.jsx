import { useState } from 'react'
import Nav from './Nav'
import Hero from './Hero'
import Heading from './Heading'
import Work from './Work'
import Footer from '../components/layout/Footer'
import SkillsSummary from '../components/skills/SkillsSummary'
import GithubHeatmap from '../components/skills/GithubHeatmap'
import TimelineCard from '../components/exp/TimelineCard'
import CompactRoleList from '../components/exp/CompactRoleList'
import EducationBlock from '../components/exp/EducationBlock'
import About from '../components/misc/About'
import Achievements from '../components/misc/Achievements'
import Contact from '../components/misc/Contact'
import useGsapReveal from '../hooks/useGsapReveal'
import copy from '../content/another.json'
import sections from '../content/sections.json'
import experience from '../content/experience.json'
import education from '../content/education.json'
import './another.css'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Barlow+Condensed:wght@600;700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap'

function storedMode() {
  try {
    return localStorage.getItem('another-mode') === 'white' ? 'white' : 'blue'
  } catch {
    return 'blue'
  }
}

export default function AnotherPage() {
  const [mode, setMode] = useState(storedMode)
  const timelineRef = useGsapReveal()

  function toggle(next) {
    setMode(next)
    try {
      localStorage.setItem('another-mode', next)
    } catch {
      // private mode: the choice lasts for this visit
    }
  }

  const head = (id) => ({ id, title: sections[id].heading, note: copy.notes[id] })

  return (
    <div className="bp" data-mode={mode}>
      <title>{copy.title}</title>
      {/* a draft beside the real home page: keep it out of search */}
      <meta name="robots" content="noindex, nofollow" />
      <link rel="stylesheet" href={FONTS} precedence="default" />
      <Nav mode={mode} onToggle={toggle} />
      <main id="main" className="bp-body">
        <Hero />
        <Heading {...head('work')}>
          <Work />
        </Heading>
        <Heading {...head('experience')}>
          <div ref={timelineRef} className="mt-4">
            {experience.tier1.map((exp) => (
              <TimelineCard key={exp.org} experience={exp} />
            ))}
            <CompactRoleList roles={experience.tier2} />
          </div>
          <h3 className="mt-10 text-ink">{sections.experience.educationHeading}</h3>
          <div className="mt-4">
            <EducationBlock education={education} />
          </div>
        </Heading>
        <Heading {...head('skills')}>
          <SkillsSummary />
          <div className="mt-12">
            <GithubHeatmap />
          </div>
        </Heading>
        <Heading {...head('about')}>
          <About />
        </Heading>
        <Heading {...head('achievements')}>
          <div className="mt-8">
            <Achievements />
          </div>
        </Heading>
        <Heading {...head('contact')}>
          <Contact />
        </Heading>
      </main>
      <Footer />
    </div>
  )
}
