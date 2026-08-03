import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
import projects from './content/projects.json'
import skills from './content/skills.json'
import experience from './content/experience.json'
import education from './content/education.json'

function Home() {
  const featuredProjects = projects
    .filter((p) => p.featured)
    .sort((a, b) => a.order - b.order)
  const moreProjects = projects
    .filter((p) => !p.featured)
    .sort((a, b) => a.order - b.order)

  return (
    <>
      <Nav />
      <main>
        <Hero />

        <Section id="work">
          <h2 className="text-ink">Work</h2>
          <div className="mt-10 space-y-8">
            {featuredProjects.map((project, i) => (
              <FeaturedCard key={project.id} project={project} index={i} />
            ))}
          </div>

          {moreProjects.length > 0 && (
            <div className="mt-16">
              <h3 className="font-display text-lg font-semibold text-ink">
                More projects
              </h3>
              <div className="mt-6">
                <ProjectGrid projects={moreProjects} />
              </div>
            </div>
          )}
        </Section>

        <Section id="skills" className="border-t border-line">
          <h2 className="text-ink">Skills</h2>
          <div className="mt-10 space-y-8">
            {skills.map((group) => (
              <SkillGroup key={group.group} group={group.group} skills={group.skills} />
            ))}
          </div>

          <div className="mt-12">
            <GithubHeatmap />
          </div>
        </Section>

        <Section id="experience" className="border-t border-line">
          <h2 className="text-ink">Experience</h2>
          <div className="mt-10 space-y-14">
            {experience.tier1.map((exp) => (
              <TimelineCard key={exp.org} experience={exp} />
            ))}
            <CompactRoleList roles={experience.tier2} />
          </div>

          <div className="mt-16">
            <h3 className="font-display text-lg font-semibold text-ink">Education</h3>
            <div className="mt-6">
              <EducationBlock education={education} />
            </div>
          </div>
        </Section>

        <Section id="about" className="border-t border-line">
          <h2 className="text-ink">Achievements</h2>
          <div className="mt-10">
            <Achievements />
          </div>

          <div className="mt-24">
            <Contact />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
