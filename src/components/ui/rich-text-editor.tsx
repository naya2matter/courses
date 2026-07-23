import { useRef, useCallback, useEffect, useState, type MouseEvent } from 'react'
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
  Link, Unlink,
  Heading2,
  Eraser,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

interface FmtState {
  bold: boolean
  italic: boolean
  underline: boolean
  strikeThrough: boolean
  insertUnorderedList: boolean
  insertOrderedList: boolean
}

// ── Toolbar atom ──────────────────────────────────────────────────────────────

interface BtnProps {
  title: string
  active?: boolean
  onMouseDown: (e: MouseEvent<HTMLButtonElement>) => void
  children: React.ReactNode
  className?: string
}

function Btn({ title, active, onMouseDown, children, className }: BtnProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={onMouseDown}
      className={cn(
        'inline-flex items-center justify-center rounded px-1.5 py-1 transition-colors duration-100 select-none',
        'text-muted-foreground hover:text-foreground hover:bg-white/8',
        active && 'bg-white/10 text-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="mx-0.5 h-4 w-px shrink-0 bg-muted-foreground/20" />
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function run(command: string, value?: string) {
  document.execCommand(command, false, value)
}

function queryFmt(): FmtState {
  try {
    return {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
    }
  } catch {
    return { bold: false, italic: false, underline: false, strikeThrough: false, insertUnorderedList: false, insertOrderedList: false }
  }
}

function isEffectivelyEmpty(html: string) {
  return !html || html === '<br>' || html === '<p></p>' || html === '<p><br></p>'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing…',
  minHeight = 160,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  // Sentinel start value so the first sync always writes the initial value into
  // the DOM (e.g. an existing description loaded on the Edit page). Seeding this
  // with `value` would make the mount effect no-op and leave the editor blank.
  const lastHtmlRef = useRef<string | null>(null)
  const [fmt, setFmt] = useState<FmtState>(queryFmt)
  const [isEmpty, setIsEmpty] = useState(() => isEffectivelyEmpty(value))

  // Sync external value → DOM without losing cursor
  useEffect(() => {
    const el = editorRef.current
    if (el && value !== lastHtmlRef.current) {
      el.innerHTML = value || ''
      lastHtmlRef.current = value
      setIsEmpty(isEffectivelyEmpty(value))
    }
  }, [value])

  const flush = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    const html = el.innerHTML
    const clean = isEffectivelyEmpty(html) ? '' : html
    setIsEmpty(!clean)
    lastHtmlRef.current = clean
    onChange(clean)
  }, [onChange])

  const refreshFmt = useCallback(() => setFmt(queryFmt()), [])

  // Toolbar button handler: prevent blur, run command, refresh
  const cmd = useCallback(
    (command: string, val?: string) =>
      (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        run(command, val)
        editorRef.current?.focus()
        flush()
        refreshFmt()
      },
    [flush, refreshFmt],
  )

  const handleLink = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      const url = window.prompt('Enter URL:', 'https://')
      if (url?.trim()) {
        run('createLink', url.trim())
        editorRef.current?.focus()
        flush()
      }
    },
    [flush],
  )

  return (
    <div
      className={cn(
        'rounded-md border border-muted-foreground/20 bg-muted/10 overflow-hidden transition-colors',
        'focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50',
      )}
    >
      {/* ── Toolbar ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2.5 py-1.5 border-b border-muted-foreground/15 bg-background/30">

        {/* Text format */}
        <Btn title="Bold (Ctrl+B)" active={fmt.bold} onMouseDown={cmd('bold')}>
          <Bold size={13} strokeWidth={2.2} />
        </Btn>
        <Btn title="Italic (Ctrl+I)" active={fmt.italic} onMouseDown={cmd('italic')}>
          <Italic size={13} strokeWidth={2.2} />
        </Btn>
        <Btn title="Underline (Ctrl+U)" active={fmt.underline} onMouseDown={cmd('underline')}>
          <Underline size={13} strokeWidth={2.2} />
        </Btn>
        <Btn title="Strikethrough" active={fmt.strikeThrough} onMouseDown={cmd('strikeThrough')}>
          <Strikethrough size={13} strokeWidth={2.2} />
        </Btn>

        <Divider />

        {/* Heading */}
        <Btn title="Heading" onMouseDown={cmd('formatBlock', 'h2')}>
          <Heading2 size={13} strokeWidth={2.2} />
        </Btn>
        <Btn title="Paragraph" onMouseDown={cmd('formatBlock', 'p')}>
          <span className="text-[11px] font-semibold leading-none tracking-tight">P</span>
        </Btn>

        <Divider />

        {/* Lists */}
        <Btn title="Bullet list" active={fmt.insertUnorderedList} onMouseDown={cmd('insertUnorderedList')}>
          <List size={13} strokeWidth={2.2} />
        </Btn>
        <Btn title="Numbered list" active={fmt.insertOrderedList} onMouseDown={cmd('insertOrderedList')}>
          <ListOrdered size={13} strokeWidth={2.2} />
        </Btn>

        <Divider />

        {/* Alignment */}
        <Btn title="Align left" onMouseDown={cmd('justifyLeft')}>
          <AlignLeft size={13} strokeWidth={2.2} />
        </Btn>
        <Btn title="Align center" onMouseDown={cmd('justifyCenter')}>
          <AlignCenter size={13} strokeWidth={2.2} />
        </Btn>
        <Btn title="Align right" onMouseDown={cmd('justifyRight')}>
          <AlignRight size={13} strokeWidth={2.2} />
        </Btn>

        <Divider />

        {/* Link */}
        <Btn title="Insert link" onMouseDown={handleLink}>
          <Link size={13} strokeWidth={2.2} />
        </Btn>
        <Btn title="Remove link" onMouseDown={cmd('unlink')}>
          <Unlink size={13} strokeWidth={2.2} />
        </Btn>

        <Divider />

        {/* Clear */}
        <Btn title="Clear formatting" onMouseDown={cmd('removeFormat')}>
          <Eraser size={13} strokeWidth={2.2} />
        </Btn>
      </div>

      {/* ── Edit area ──────────────────────────────────────────────── */}
      <div className="relative">
        {/* Placeholder overlay */}
        {isEmpty && (
          <p className="absolute inset-0 px-4 py-3 text-sm text-muted-foreground/60 pointer-events-none select-none leading-relaxed">
            {placeholder}
          </p>
        )}

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={flush}
          onKeyUp={refreshFmt}
          onMouseUp={refreshFmt}
          onFocus={refreshFmt}
          className={cn(
            'px-4 py-3 text-sm outline-none leading-relaxed caret-primary',
            // Content styling
            '[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-1',
            '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-1.5 [&_h2]:mt-1',
            '[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-1',
            '[&_p]:mb-1.5 last:[&_p]:mb-0',
            '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ul]:space-y-0.5',
            '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_ol]:space-y-0.5',
            '[&_li]:leading-relaxed',
            '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
            '[&_strong]:font-semibold',
            '[&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground',
          )}
          style={{ minHeight }}
        />
      </div>
    </div>
  )
}
