import profile from '../../content/profile.json'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-line py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 text-sm text-faint md:flex-row md:items-center md:justify-between md:px-10">
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
