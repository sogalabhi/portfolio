import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { track } from '@vercel/analytics'
import { bus, EVENTS } from '../bus'
import { ZONES } from '../data/zones'
import profile from '../../content/profile.json'

const ZONE_IDS = ZONES.map((z) => z.id).filter((id) => id !== 'terminal')

const HELP_LINES = [
  'whoami        who is this',
  'ls            list zones',
  'cd <zone>     travel there',
  'cat resume    download résumé',
  'contact       show email',
  'clear         clear screen',
  'sudo hire-me  ?',
]

function Confetti() {
  const pieces = Array.from({ length: 24 }, (_, i) => i)
  const colors = ['#F2A65A', '#E86A6A', '#5FA65A', '#F4EDE2']

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((i) => (
        <span
          key={i}
          className="absolute top-0 h-2 w-2 rounded-sm"
          style={{
            left: `${(i * 41) % 100}%`,
            backgroundColor: colors[i % colors.length],
            animation: `world-confetti-fall 1.4s ease-in ${i * 0.02}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes world-confetti-fall {
          from { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          to { transform: translateY(90vh) rotate(280deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default function Terminal({ onClose }) {
  const [lines, setLines] = useState([
    "guest@island:~$ type 'help' to see what's here",
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [confetti, setConfetti] = useState(false)
  const inputRef = useRef(null)
  const logRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [lines])

  const print = (text) => setLines((prev) => [...prev, text])

  const runCommand = (raw) => {
    const cmd = raw.trim()
    if (!cmd) return
    print(`guest@island:~$ ${cmd}`)

    const [name, ...args] = cmd.split(/\s+/)

    switch (name) {
      case 'help':
        print(HELP_LINES.join('\n'))
        break
      case 'whoami':
        print(`${profile.name} — ${profile.tagline}`)
        break
      case 'ls':
        print(ZONE_IDS.join('  '))
        break
      case 'cd': {
        const target = args[0]
        if (!target) {
          print('usage: cd <zone>')
        } else if (ZONE_IDS.includes(target)) {
          print(`traveling to ${target}...`)
          bus.emit(EVENTS.TELEPORT, { id: target })
          setTimeout(onClose, 400)
        } else {
          print(`no such zone: ${target} — try 'ls'`)
        }
        break
      }
      case 'cat':
        if (args[0] === 'resume') {
          track('resume_download', { source: 'world_terminal' })
          window.open(profile.links.resume, '_blank', 'noopener,noreferrer')
          print('opening resume.pdf...')
        } else {
          print(`cat: ${args.join(' ')}: no such file`)
        }
        break
      case 'contact':
        print(profile.email)
        break
      case 'clear':
        setLines([])
        break
      case 'sudo':
        if (args.join(' ') === 'hire-me') {
          navigator.clipboard?.writeText(profile.email).catch(() => {})
          setConfetti(true)
          setTimeout(() => setConfetti(false), 1500)
          print(`Copied ${profile.email} to your clipboard. Let's talk.`)
        } else {
          print(`sudo: ${args.join(' ')}: command not found`)
        }
        break
      default:
        print(`command not found: ${name} — try 'help'`)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) setHistory((prev) => [...prev, input])
    setHistoryIndex(-1)
    runCommand(input)
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length === 0) return
      const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(historyIndex - 1, 0)
      setHistoryIndex(nextIndex)
      setInput(history[nextIndex])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex === -1) return
      const nextIndex = historyIndex + 1
      if (nextIndex >= history.length) {
        setHistoryIndex(-1)
        setInput('')
      } else {
        setHistoryIndex(nextIndex)
        setInput(history[nextIndex])
      }
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      {confetti && <Confetti />}
      <div
        role="dialog"
        aria-label="Terminal"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex h-[70vh] w-full max-w-xl flex-col rounded-lg border border-[#4A7C4E]/40 bg-black/90 p-4 font-mono text-sm text-[#5FA65A] shadow-2xl"
      >
        <div className="mb-2 flex items-center justify-between border-b border-[#4A7C4E]/30 pb-2">
          <p style={{ fontFamily: "'Press Start 2P', monospace" }} className="text-xs text-[#5FA65A]">
            terminal
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close terminal"
            className="cursor-pointer text-[#5FA65A]/70 hover:text-[#F2A65A]"
          >
            <X size={16} />
          </button>
        </div>

        <div ref={logRef} className="flex-1 overflow-y-auto whitespace-pre-wrap pr-1">
          {lines.map((line, i) => (
            <div key={i} className="mb-1">
              {line}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2 border-t border-[#4A7C4E]/30 pt-2">
          <span>guest@island:~$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-[#F4EDE2] outline-none"
            autoComplete="off"
            spellCheck="false"
            aria-label="Terminal input"
          />
        </form>
      </div>
    </div>
  )
}
