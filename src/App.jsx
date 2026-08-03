import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from './lib/gsap'
import useGsapReveal from './hooks/useGsapReveal'
import useReducedMotion from './hooks/useReducedMotion'
import Nav from './components/layout/Nav'
import Footer from './components/layout/Footer'
import Section from './components/layout/Section'
import Hero from './components/hero/Hero'
import FeaturedCard from './components/work/FeaturedCard'
import ProjectGrid from './components/work/ProjectGrid'
import SkillGroup from './components/skills/SkillGroup'
import GithubHeatmap from './components/skills/GithubHeatmap'
import TimelineCard from './components/exp/TimelineCard'
import CompactRoleList from './components/exp/CompactRoleList'
import EducationBlock from './components/exp/EducationBlock'
import Achievements from './components/misc/Achievements'
import Contact from './components/misc/Contact'
import NotFound from './components/misc/NotFound'
import TourController from './components/misc/TourController'
import ScrollProgressBar from './components/misc/ScrollProgressBar'
import KeyboardShortcuts from './components/misc/KeyboardShortcuts'
import projects from './content/projects.json'
import skills from './content/skills.json'
import experience from './content/experience.json'
import education from './content/education.json'
import sections from './content/sections.json'

const World = lazy(() => import('./world/WorldPage'))

function Home() {
  const featuredProjects = projects
    .filter((p) => p.featured)
    .sort((a, b) => a.order - b.order)
  const moreProjects = projects
    .filter((p) => !p.featured)
    .sort((a, b) => a.order - b.order)

  const featuredRevealRef = useGsapReveal({ stagger: 0.12 })
  const skillsRevealRef = useGsapReveal({ stagger: 0.02, y: 8 })
  const timelineRevealRef = useGsapReveal()
  const reducedMotion = useReducedMotion()

  useGSAP(
    () => {
      const line = timelineRevealRef.current?.querySelector('[data-timeline-line]')
      if (!line) return

      const alreadyPast =
        timelineRevealRef.current.getBoundingClientRect().top < window.innerHeight * 0.85

      if (reducedMotion || alreadyPast) {
        gsap.set(line, { scaleY: 1 })
        return
      }

      gsap.from(line, {
        scaleY: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: timelineRevealRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    },
    { scope: timelineRevealRef, dependencies: [reducedMotion] },
  )

  return (
    <>
      <a
        href="#main"
        className="fixed left-4 top-4 z-[100] -translate-y-20 rounded-lg bg-clay px-4 py-2 text-sm font-medium text-paper transition-transform duration-150 focus:translate-y-0 print:hidden"
      >
        Skip to content
      </a>

      <Nav />
      <main id="main">
        <Hero />

        <Section id="work">
          <h2 className="text-ink">{sections.work.heading}</h2>
          <div ref={featuredRevealRef} className="mt-10 space-y-8">
            {featuredProjects.map((project, i) => (
              <FeaturedCard key={project.id} project={project} index={i} />
            ))}
          </div>

          {moreProjects.length > 0 && (
            <div className="mt-16">
              <h3 className="font-display text-lg font-semibold text-ink">
                {sections.work.moreHeading}
              </h3>
              <div className="mt-6">
                <ProjectGrid projects={moreProjects} />
              </div>
            </div>
          )}
        </Section>

        <Section id="skills" className="border-t border-line">
          <h2 className="text-ink">{sections.skills.heading}</h2>
          <div ref={skillsRevealRef} className="mt-10 space-y-8">
            {skills.map((group) => (
              <SkillGroup key={group.group} group={group.group} skills={group.skills} />
            ))}
          </div>

          <div className="mt-12">
            <GithubHeatmap />
          </div>
        </Section>

        <Section id="experience" className="border-t border-line">
          <h2 className="text-ink">{sections.experience.heading}</h2>
          <div ref={timelineRevealRef} className="relative mt-10 space-y-14">
            <div
              data-timeline-line
              className="absolute bottom-2 left-0 top-2 w-px origin-top bg-line"
              aria-hidden="true"
            />
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

        <Section id="about" className="border-t border-line">
          <div id="achievements" className="scroll-mt-20">
            <h2 className="text-ink">{sections.achievements.heading}</h2>
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
      <TourController />
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
