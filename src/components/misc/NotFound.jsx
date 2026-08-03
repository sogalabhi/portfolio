import { Link } from 'react-router-dom'
import Nav from '../layout/Nav'
import sections from '../../content/sections.json'

export default function NotFound() {
  const { notFound } = sections

  return (
    <>
      <Nav />
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-sm text-faint">{notFound.eyebrow}</p>
        <h1 className="mt-4 text-ink">{notFound.title}</h1>
        <p className="mt-4 max-w-[40ch] text-slate">{notFound.body}</p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-[10px] bg-clay px-5 py-3 text-sm font-medium text-paper transition-colors duration-150 hover:bg-clay/90"
        >
          {notFound.cta}
        </Link>
      </main>
    </>
  )
}
