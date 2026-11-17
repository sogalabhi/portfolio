import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { ScrollTrigger } from './lib/gsap'
import useGsapReveal from './hooks/useGsapReveal'
import Nav from './components/layout/Nav'
import Footer from './components/layout/Footer'
import Section from './components/layout/Section'
import SectionIcon from './components/layout/SectionIcon'
import WorldMiniBanner from './components/layout/WorldMiniBanner'
import PageScatter from './components/layout/PageScatter'
import Hero from './components/hero/Hero'
import MarginCharacter from './components/hero/MarginCharacter'
import ProjectExplorer from './components/work/ProjectExplorer'
import SkillsSummary from './components/skills/SkillsSummary'
import GithubHeatmap from './components/skills/GithubHeatmap'
import TimelineCard from './components/exp/TimelineCard'
import CompactRoleList from './components/exp/CompactRoleList'
import EducationBlock from './components/exp/EducationBlock'
import Achievements from './components/misc/Achievements'
import Contact from './components/misc/Contact'
import NotFound from './components/misc/NotFound'
import ScrollProgressBar from './components/misc/ScrollProgressBar'
import KeyboardShortcuts from './components/misc/KeyboardShortcuts'
import projects from './content/projects.json'
import experience from './content/experience.json'
import education from './content/education.json'
import sections from './content/sections.json'

const World = lazy(() => import('./world/WorldPage'))

function Home() {
  const orderedProjects = [...projects].sort((a, b) => a.order - b.order)

  const timelineRevealRef = useGsapReveal()

  return (
    <>
      <a
        href="#main"
        className="fixed left-4 top-4 z-[100] -translate-y-20 rounded-lg bg-clay px-4 py-2 text-sm font-medium text-paper transition-transform duration-150 focus:translate-y-0 print:hidden"
      >
        Skip to content
      </a>

      <Nav />
      <PageScatter />
      <MarginCharacter />
      <main id="main">
        <Hero />

        <Section id="work">
          <div className="flex items-center gap-4">
            <SectionIcon src="/world/sprites/workshop.png" />
            <h2 className="text-ink">{sections.work.heading}</h2>
          </div>
          <div className="mt-8">
            <ProjectExplorer projects={orderedProjects} />
          </div>
        </Section>

        <Section id="experience" className="border-t border-line">
          <div className="flex items-center gap-4">
            <SectionIcon src="/world/sprites/archive.png" />
            <h2 className="text-ink">{sections.experience.heading}</h2>
          </div>
          <div ref={timelineRevealRef} className="mt-10">
            {experience.tier1.map((exp) => (
              <TimelineCard key={exp.org} experience={exp} />
            ))}
            <CompactRoleList roles={experience.tier2} />
          </div>

          <div className="mt-16">
            <h3 className="font-display text-lg font-semibold text-ink">
              {sections.experience.educationHeading}
            </h3>
            <div className="mt-6">
              <EducationBlock education={education} />
            </div>
          </div>
        </Section>

        <Section id="skills" className="border-t border-line">
          <div className="flex items-center gap-4">
            <SectionIcon src="/world/sprites/shed.png" />
            <h2 className="text-ink">{sections.skills.heading}</h2>
          </div>
          <SkillsSummary />

          <div className="mt-12">
            <GithubHeatmap />
          </div>
        </Section>

        <Section id="about" className="border-t border-line">
          <div id="achievements" className="scroll-mt-20">
            <div className="flex items-center gap-4">
              <SectionIcon src="/world/sprites/shrine.png" />
              <h2 className="text-ink">{sections.achievements.heading}</h2>
            </div>
            <div className="mt-10">
              <Achievements />
            </div>
          </div>

          <div id="contact" className="scroll-mt-20 mt-24">
            <Contact />
          </div>
        </Section>
      </main>
      <Footer />
      <WorldMiniBanner />
    </>
  )
}

export default function App() {
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    const handleLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', handleLoad)
    return () => window.removeEventListener('load', handleLoad)
  }, [])

  return (
    <BrowserRouter>
      <ScrollProgressBar />
      <KeyboardShortcuts />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/world"
          element={
            <Suspense fallback={<div className="fixed inset-0 bg-paper" />}>
              <World />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  )
}
