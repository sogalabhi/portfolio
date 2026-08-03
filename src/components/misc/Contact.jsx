import { useState } from 'react'
import { Copy, Check, FileText } from 'lucide-react'
import { track } from '@vercel/analytics'
import profile from '../../content/profile.json'
import sections from '../../content/sections.json'
import { GithubIcon, LinkedinIcon } from './BrandIcons'

export default function Contact() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(profile.email)
    track('contact_email_click', { method: 'copy' })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <h2 className="text-ink">{sections.contact.heading}</h2>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href={`mailto:${profile.email}`}
          onClick={() => track('contact_email_click', { method: 'mailto' })}
          className="font-display text-2xl font-semibold text-clay transition-colors duration-150 hover:text-clay/80 md:text-3xl"
        >
          {profile.email}
        </a>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy email address"
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-slate transition-colors duration-150 hover:border-clay hover:text-clay"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="mt-8 flex flex-wrap gap-6">
        <a
          href={profile.links.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-slate transition-colors duration-150 hover:text-clay"
        >
          <GithubIcon size={16} />
          GitHub
        </a>
        <a
          href={profile.links.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-slate transition-colors duration-150 hover:text-clay"
        >
          <LinkedinIcon size={16} />
          LinkedIn
        </a>
        <a
          href={profile.links.resume}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('resume_download', { source: 'contact' })}
          className="inline-flex items-center gap-2 text-slate transition-colors duration-150 hover:text-clay"
        >
          <FileText size={16} aria-hidden="true" />
          Résumé (PDF)
        </a>
      </div>

      <p className="mt-8 text-sm text-faint">{profile.location}</p>
    </div>
  )
}
