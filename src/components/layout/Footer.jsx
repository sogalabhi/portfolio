import profile from '../../content/profile.json'

// Deep plum (--color-panel), not the paper background the rest of the page
// uses — a single deliberate dark section, the "you're leaving the article"
// cue right before the page ends. See index.css for why this and teal are
// the only two /world colors borrowed here, and why as accents, not a
// palette-wide swap.
export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-panel py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 text-sm text-paper/60 md:flex-row md:items-center md:justify-between md:px-10">
        <p>
          © {year} {profile.name}
        </p>
        <div className="flex gap-6">
          <a
            href={profile.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-150 hover:text-clay"
          >
            GitHub
          </a>
          <a
            href={profile.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-150 hover:text-clay"
          >
            LinkedIn
          </a>
          <a
            href={profile.links.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-150 hover:text-clay"
          >
            Résumé
          </a>
        </div>
      </div>
    </footer>
  )
}
