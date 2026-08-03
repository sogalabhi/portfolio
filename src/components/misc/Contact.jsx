import { useState } from 'react'
import { Copy, Check, FileText } from 'lucide-react'
import profile from '../../content/profile.json'
import { GithubIcon, LinkedinIcon } from './BrandIcons'

export default function Contact() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(profile.email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <h2 className="text-ink">Let's build something.</h2>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href={`mailto:${profile.email}`}
          className="font-display text-2xl font-semibold text-clay transition-colors duration-150 hover:text-clay/80 md:text-3xl"
        >
          {profile.email}
        </a>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy email address"
          className="cursor-pointer rounded-lg border border-line p-2 text-slate transition-colors duration-150 hover:border-clay hover:text-clay"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
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
