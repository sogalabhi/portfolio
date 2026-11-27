import { Mail, FileText } from 'lucide-react'
import { track } from '@vercel/analytics'
import profile from '../../content/profile.json'
import sections from '../../content/sections.json'
import { GithubIcon, LinkedinIcon } from '../misc/BrandIcons'

const copy = sections.contact

// Contact and footer in one: a line on how to reach me, one row of icons
// (email among them, not a headline of its own), and the copyright. Every
// link appears once.
const LINKS = [
  {
    key: 'email',
    href: `mailto:${profile.email}`,
    label: `${copy.email}: ${profile.email}`,
    Icon: Mail,
    onClick: () => track('contact_email_click', { method: 'mailto' }),
  },
  { key: 'github', href: profile.links.github, label: copy.github, Icon: GithubIcon, external: true },
  { key: 'linkedin', href: profile.links.linkedin, label: copy.linkedin, Icon: LinkedinIcon, external: true },
  {
    key: 'resume',
    href: profile.links.resume,
    label: copy.resume,
    Icon: FileText,
    external: true,
    onClick: () => track('resume_download', { source: 'contact' }),
  },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer id="contact" className="scroll-mt-20 pt-16 md:pt-24">
      <div className="mx-auto max-w-5xl px-6 md:px-10">
        <h2 className="border-b border-ink/25 pb-4 text-ink">{copy.heading}</h2>
        <p className="mt-8 max-w-[52ch] text-lg leading-relaxed text-slate">{copy.body}</p>

        <ul className="mt-6 flex flex-wrap gap-3">
          {LINKS.map(({ key, href, label, Icon, external, onClick }) => (
            <li key={key}>
              <a
                href={href}
                aria-label={label}
                title={label}
                onClick={onClick}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="inline-flex h-12 w-12 items-center justify-center border border-ink/30 text-ink transition-colors duration-150 hover:border-ink hover:bg-ink hover:text-paper"
              >
                <Icon size={20} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-16 flex flex-wrap justify-between gap-x-6 gap-y-1 border-t border-line py-6 text-sm text-faint">
          <p>
            © {year} {profile.name}
          </p>
          <p>{profile.location}</p>
        </div>
      </div>
    </footer>
  )
}
