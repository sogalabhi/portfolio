import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { ScrollTrigger } from './lib/gsap'
import useGsapReveal from './hooks/useGsapReveal'
import Nav from './components/layout/Nav'
import Footer from './components/layout/Footer'
import Section from './components/layout/Section'
import SectionHeader from './components/layout/SectionHeader'
import WorldMiniBanner from './components/layout/WorldMiniBanner'
import MarginAlignment from './components/layout/MarginAlignment'
import Hero from './components/hero/Hero'
import ProjectExplorer from './components/work/ProjectExplorer'
import SkillsSummary from './components/skills/SkillsSummary'
import GithubHeatmap from './components/skills/GithubHeatmap'
import TimelineCard from './components/exp/TimelineCard'
import CompactRoleList from './components/exp/CompactRoleList'
import EducationBlock from './components/exp/EducationBlock'
import About from './components/misc/About'
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
      <MarginAlignment />
      <main id="main">
        <Hero />

        <Section id="work">
          <SectionHeader id="work" />
          <div className="mt-10">
            <ProjectExplorer projects={orderedProjects} />
          </div>
        </Section>

        <Section id="experience">
          <SectionHeader id="experience" />
          <div ref={timelineRevealRef} className="mt-4">
            {experience.tier1.map((exp) => (
              <TimelineCard key={exp.org} experience={exp} />
            ))}
            <CompactRoleList roles={experience.tier2} />
          </div>

          <div className="mt-14">
            <h3 className="font-mono text-[11px] font-normal uppercase tracking-[0.1em] text-slate">
              {sections.experience.educationHeading}
            </h3>
            <div className="mt-4">
              <EducationBlock education={education} />
            </div>
          </div>
        </Section>

        <Section id="skills">
          <SectionHeader id="skills" />
          <SkillsSummary />

          <div className="mt-12">
            <GithubHeatmap />
          </div>
        </Section>

        <Section id="about">
          <SectionHeader id="about" />
          <About />
        </Section>

        <Section id="achievements">
          <SectionHeader id="achievements" />
          <div className="mt-8">
            <Achievements />
          </div>
        </Section>

        <Section id="contact">
          <SectionHeader id="contact" />
          <Contact />
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
