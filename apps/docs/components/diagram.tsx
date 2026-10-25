import type { CSSProperties, ReactNode } from 'react'

type DiagramProps = {
  /** Prefixes the ids inside the SVG, so two diagrams on one page do not share one. */
  id: string
  title: string
  description: string
  width: number
  height: number
  children: ReactNode
}

const arrowIdOf = (id: string): string => `${id}-arrow`

/** The `markerEnd` value that puts the arrow head of diagram `id` on a connector. */
export const arrowOf = (id: string): string => `url(#${arrowIdOf(id)})`

/**
 * The frame of a diagram drawn inline: an accessible SVG with the arrow head its connectors use.
 * The colours come from the classes under `.diagram` in `app/global.css`, which follow the theme.
 */
export const Diagram = ({
  id,
  title,
  description,
  width,
  height,
  children,
}: DiagramProps): ReactNode => (
  <figure
    className="diagram not-prose my-6 overflow-x-auto"
    style={{ '--diagram-width': `${width}px` } as CSSProperties}
  >
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-desc`}
    >
      <title id={`${id}-title`}>{title}</title>
      <desc id={`${id}-desc`}>{description}</desc>
      <defs>
        <marker id={arrowIdOf(id)} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon className="head" points="0 0, 8 3, 0 6" />
        </marker>
      </defs>
      <rect className="bg" width="100%" height="100%" />
      {children}
    </svg>
  </figure>
)
