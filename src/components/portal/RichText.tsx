'use client'

/** Renders text with [text](url) markdown links as real anchor tags. */
function parseLinks(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:opacity-70 transition-opacity"
      >
        {match[1]}
      </a>
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const lines = text.split('\n')
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={i}>
          {parseLinks(line)}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </span>
  )
}
