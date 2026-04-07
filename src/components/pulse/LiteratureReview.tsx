'use client'

export interface ReviewPaper {
  star?: boolean
  author: string
  title: string
  source: string
  note?: string
}

export interface ReviewClaim {
  type: 'thesis' | 'critique' | 'definition' | 'methodology'
  text: string
  author: string
  year: number
}

export interface ReviewSection {
  id: number
  title: string
  intro: string
  papers: ReviewPaper[]
  commentary: string
  claims: ReviewClaim[]
}

export interface ReviewData {
  id: string
  title: string
  date: string
  primaryColor: string
  claimBg: string
  claimBorder: string
  claimHeadingColor: string
  stats: {
    papers: number
    claims: number
    sections: number
    yearRange: string
  }
  sections: ReviewSection[]
  supplement?: {
    title: string
    papers: ReviewPaper[]
  }
}

const CLAIM_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  thesis: { label: '论点', bg: '#ebf8ff', color: '#2b6cb0' },
  critique: { label: '批判', bg: '#fff5f5', color: '#c53030' },
  definition: { label: '定义', bg: '#f0fff4', color: '#276749' },
  methodology: { label: '方法', bg: '#faf5ff', color: '#6b46c1' },
}

function PaperItem({ paper }: { paper: ReviewPaper }) {
  return (
    <div className="flex items-start gap-2">
      <span
        className="flex-shrink-0 w-5 text-center leading-[1.7]"
        style={{
          color: paper.star ? '#d69e2e' : '#718096',
          fontWeight: paper.star ? 'bold' : 'normal',
          fontSize: '0.9rem',
        }}
      >
        {paper.star ? '★' : '●'}
      </span>
      <div className="flex-1 min-w-0">
        <span style={{ fontWeight: 600 }}>{paper.author}</span>
        <span>{paper.title}</span>
        <span style={{ color: '#718096', fontSize: '0.85rem' }}>{paper.source}</span>
        {paper.note && (
          <span
            className="block mt-0.5"
            style={{ color: '#c53030', fontSize: '0.85rem', fontStyle: 'italic' }}
          >
            {paper.note}
          </span>
        )}
      </div>
    </div>
  )
}

function ClaimItem({
  claim,
  isFirst,
  borderColor,
}: {
  claim: ReviewClaim
  isFirst: boolean
  borderColor: string
}) {
  const ct = CLAIM_STYLES[claim.type] || CLAIM_STYLES.thesis
  return (
    <div
      className="flex gap-2 py-2"
      style={{
        fontSize: '0.85rem',
        lineHeight: 1.6,
        borderTop: isFirst ? 'none' : `1px solid ${borderColor}`,
      }}
    >
      <span
        className="flex-shrink-0 rounded px-1.5 py-0.5"
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          background: ct.bg,
          color: ct.color,
          height: 'fit-content',
          marginTop: '0.2rem',
        }}
      >
        {ct.label}
      </span>
      <div className="flex-1">
        {claim.text}
        <br />
        <span style={{ color: '#718096', fontSize: '0.78rem' }}>
          — {claim.author} ({claim.year})
        </span>
      </div>
    </div>
  )
}

export function LiteratureReview({ data }: { data: ReviewData }) {
  const { primaryColor: pc, claimBg, claimBorder, claimHeadingColor } = data

  return (
    <div
      className="mx-auto max-w-[960px] px-6 py-8"
      style={{
        fontFamily:
          '"Noto Serif SC", "Source Han Serif CN", "Songti SC", Georgia, serif',
        lineHeight: 1.8,
        color: '#1a202c',
      }}
    >
      {/* Title */}
      <h1
        className="text-center font-bold"
        style={{ fontSize: '1.75rem', color: pc, letterSpacing: '0.05em' }}
      >
        {data.title}
      </h1>
      <p
        className="text-center mt-2 mb-10 pb-6"
        style={{
          color: '#718096',
          fontSize: '0.9rem',
          borderBottom: `2px solid ${pc}`,
        }}
      >
        基于 CLSCI 核心期刊论文数据库的文献检索与论点挖掘 · {data.date}
      </p>

      {/* Stats Bar */}
      <div className="flex justify-center gap-8 mb-8 flex-wrap">
        {[
          { num: String(data.stats.papers), label: '经验证文献' },
          { num: String(data.stats.claims), label: '相关论点' },
          { num: String(data.stats.sections), label: '主题板块' },
          { num: data.stats.yearRange, label: '时间跨度' },
        ].map((s) => (
          <div
            key={s.label}
            className="text-center px-5 py-3 rounded-lg min-w-[120px]"
            style={{
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            <span
              className="block font-bold"
              style={{ fontSize: '1.5rem', color: pc }}
            >
              {s.num}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#718096' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Sections */}
      {data.sections.map((section) => (
        <section
          key={section.id}
          className="mb-10 rounded-[10px]"
          style={{
            background: '#fff',
            padding: '1.5rem 2rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            borderLeft: `4px solid ${pc}`,
          }}
        >
          {/* Heading */}
          <h2
            className="font-bold mb-2 flex items-center gap-2"
            style={{ fontSize: '1.2rem', color: pc }}
          >
            <span
              className="inline-flex items-center justify-center rounded-full text-white flex-shrink-0"
              style={{
                width: 28,
                height: 28,
                fontSize: '0.85rem',
                background: pc,
              }}
            >
              {section.id}
            </span>
            {section.title}
          </h2>

          {/* Intro */}
          <p
            className="mb-4 pb-3"
            style={{
              color: '#718096',
              fontSize: '0.9rem',
              borderBottom: '1px dashed #e2e8f0',
            }}
          >
            {section.intro}
          </p>

          {/* Paper list */}
          <div className="mb-4">
            {section.papers.map((paper, pi) => (
              <div
                key={pi}
                className="py-1.5"
                style={{
                  fontSize: '0.92rem',
                  lineHeight: 1.7,
                  borderTop: pi > 0 ? '1px dotted #e2e8f0' : 'none',
                }}
              >
                <PaperItem paper={paper} />
              </div>
            ))}
          </div>

          {/* Commentary */}
          <div
            className="my-4 rounded-r-md"
            style={{
              background: '#fffff0',
              borderLeft: '3px solid #d69e2e',
              padding: '0.75rem 1rem',
              fontSize: '0.9rem',
              color: '#744210',
            }}
          >
            <strong style={{ color: '#975a16' }}>综述角度：</strong>
            {section.commentary}
          </div>

          {/* Claims */}
          {section.claims.length > 0 && (
            <div
              className="mt-4 p-4 rounded-lg"
              style={{
                background: claimBg,
                border: `1px solid ${claimBorder}`,
              }}
            >
              <h3
                className="font-bold mb-3 flex items-center gap-1.5"
                style={{ fontSize: '0.9rem', color: claimHeadingColor }}
              >
                &#x1F50D; 核心论点
              </h3>
              {section.claims.map((claim, ci) => (
                <ClaimItem
                  key={ci}
                  claim={claim}
                  isFirst={ci === 0}
                  borderColor={claimBorder}
                />
              ))}
            </div>
          )}
        </section>
      ))}

      {/* Supplement */}
      {data.supplement && (
        <section
          className="mb-10 rounded-[10px]"
          style={{
            background: '#fff',
            padding: '1.5rem 2rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            borderLeft: '4px solid #718096',
          }}
        >
          <h2
            className="font-bold mb-4"
            style={{ fontSize: '1.2rem', color: '#718096' }}
          >
            {data.supplement.title}
          </h2>
          {data.supplement.papers.map((paper, pi) => (
            <div
              key={pi}
              className="py-1.5"
              style={{
                fontSize: '0.92rem',
                lineHeight: 1.7,
                borderTop: pi > 0 ? '1px dotted #e2e8f0' : 'none',
              }}
            >
              <PaperItem paper={paper} />
            </div>
          ))}
        </section>
      )}

      {/* Footer */}
      <footer
        className="text-center mt-12 pt-6"
        style={{
          color: '#718096',
          fontSize: '0.8rem',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        {data.stats.papers}篇文献经精确验证 · {data.stats.claims}
        条相关论点 · 生成于 {data.date}
      </footer>
    </div>
  )
}
