import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * A dropdown that closes when you click anywhere else, or press Escape.
 *
 * Uses a document-level pointerdown listener rather than a transparent
 * backdrop: a backdrop swallows the click, so dismissing the menu and then
 * pressing the button you actually wanted takes two taps.
 */
export default function Menu({
  label,
  title,
  panelClass = 'w-56',
  buttonClass = 'btn',
  children,
}: {
  label: ReactNode
  title?: string
  panelClass?: string
  buttonClass?: string
  /** Rendered when open; `close` lets an item dismiss the menu. */
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={root}>
      <button
        className={buttonClass}
        title={title}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>

      {open && (
        <div
          role="menu"
          className={`card absolute right-0 z-30 mt-1 p-1 text-sm shadow-lg ${panelClass}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}
