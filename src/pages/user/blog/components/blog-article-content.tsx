// ─── BlogArticleContent ───────────────────────────────────────────────────────
// Renders the article body with editorial typography.
// Double newlines are split into separate <p> elements for proper paragraph
// spacing. Single newlines within a paragraph are preserved with whitespace.

interface BlogArticleContentProps {
  description: string
}

export function BlogArticleContent({ description }: BlogArticleContentProps) {
  const paragraphs = description.split(/\n{2,}/).filter((p) => p.trim().length > 0)

  if (paragraphs.length <= 1) {
    return (
      <p className="whitespace-pre-wrap text-[0.9375rem] leading-[1.85] text-white/70">
        {description}
      </p>
    )
  }

  return (
    <div className="space-y-5">
      {paragraphs.map((para, i) => (
        <p
          key={i}
          className="whitespace-pre-wrap text-[0.9375rem] leading-[1.85] text-white/70"
        >
          {para}
        </p>
      ))}
    </div>
  )
}
