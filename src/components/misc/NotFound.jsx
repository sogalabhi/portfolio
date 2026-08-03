import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-sm text-faint">404</p>
      <h1 className="mt-4 text-ink">This page doesn't exist.</h1>
      <p className="mt-4 max-w-[40ch] text-slate">
        The page you're looking for was moved, renamed, or never existed.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-[10px] bg-clay px-5 py-3 text-sm font-medium text-paper transition-colors duration-150 hover:bg-clay/90"
      >
        Back to home
      </Link>
    </main>
  )
}
