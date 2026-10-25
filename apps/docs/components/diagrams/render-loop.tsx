import type { ReactNode } from 'react'

import { arrowOf, Diagram } from '../diagram'

const ID = 'render-loop'

const ARROW = arrowOf(ID)

const DESCRIPTION =
  'Fields walks a level and renders each field entry at its path, by its shape. A leaf mounts a TanStack field and hands it to its widget; an object descends into a level of its own; an array mounts a field for the list and renders one item entry per item; a custom entry mounts a field and calls its render function.'

export const RenderLoopDiagram = (): ReactNode => (
  <Diagram
    id={ID}
    title="How Fields renders a level"
    description={DESCRIPTION}
    width={792}
    height={400}
  >
    <line className="wire" x1="168" y1="200" x2="216" y2="200" markerEnd={ARROW} />
    <path
      className="wire"
      d="M 360,180 H 380 Q 388,180 388,172 V 64 Q 388,56 396,56 H 440"
      markerEnd={ARROW}
    />
    <path
      className="wire"
      d="M 360,192 H 396 Q 404,192 404,184 V 160 Q 404,152 412,152 H 440"
      markerEnd={ARROW}
    />
    <path
      className="wire"
      d="M 360,208 H 396 Q 404,208 404,216 V 240 Q 404,248 412,248 H 440"
      markerEnd={ARROW}
    />
    <path
      className="wire"
      d="M 360,220 H 380 Q 388,220 388,228 V 336 Q 388,344 396,344 H 440"
      markerEnd={ARROW}
    />
    <line className="wire" x1="584" y1="152" x2="632" y2="152" markerEnd={ARROW} />
    <line className="wire" x1="584" y1="248" x2="632" y2="248" markerEnd={ARROW} />
    <rect className="mask" x="24" y="168" width="144" height="64" rx="6" />
    <rect className="node" x="24" y="168" width="144" height="64" rx="6" />
    <rect className="tag" x="32" y="176" width="44" height="14" rx="2" />
    <text className="tag-text" x="54" y="186" textAnchor="middle">
      CONFIG
    </text>
    <text className="name" x="96" y="208" textAnchor="middle">
      Level
    </text>
    <text className="sub" x="96" y="223" textAnchor="middle">
      fields · layout
    </text>
    <rect className="mask" x="216" y="168" width="144" height="64" rx="6" />
    <rect className="node-focal" x="216" y="168" width="144" height="64" rx="6" />
    <rect className="tag-focal" x="224" y="176" width="60" height="14" rx="2" />
    <text className="tag-text-focal" x="254" y="186" textAnchor="middle">
      PER NAME
    </text>
    <text className="name-focal" x="288" y="208" textAnchor="middle">
      Field entry
    </text>
    <text className="sub-focal" x="288" y="223" textAnchor="middle">
      at its path
    </text>
    <rect className="mask" x="440" y="24" width="144" height="64" rx="6" />
    <rect className="node" x="440" y="24" width="144" height="64" rx="6" />
    <rect className="tag" x="448" y="32" width="44" height="14" rx="2" />
    <text className="tag-text" x="470" y="42" textAnchor="middle">
      WIDGET
    </text>
    <text className="name" x="512" y="64" textAnchor="middle">
      Leaf
    </text>
    <text className="sub" x="512" y="79" textAnchor="middle">
      AppField → widget
    </text>
    <rect className="mask" x="440" y="120" width="144" height="64" rx="6" />
    <rect className="node" x="440" y="120" width="144" height="64" rx="6" />
    <rect className="tag" x="448" y="128" width="44" height="14" rx="2" />
    <text className="tag-text" x="470" y="138" textAnchor="middle">
      FIELDS
    </text>
    <text className="name" x="512" y="160" textAnchor="middle">
      Object
    </text>
    <text className="sub" x="512" y="175" textAnchor="middle">
      descends one level
    </text>
    <rect className="mask" x="440" y="216" width="144" height="64" rx="6" />
    <rect className="node" x="440" y="216" width="144" height="64" rx="6" />
    <rect className="tag" x="448" y="224" width="32" height="14" rx="2" />
    <text className="tag-text" x="464" y="234" textAnchor="middle">
      ITEM
    </text>
    <text className="name" x="512" y="256" textAnchor="middle">
      Array
    </text>
    <text className="sub" x="512" y="271" textAnchor="middle">
      AppField → items
    </text>
    <rect className="mask" x="440" y="312" width="144" height="64" rx="6" />
    <rect className="node" x="440" y="312" width="144" height="64" rx="6" />
    <rect className="tag" x="448" y="320" width="44" height="14" rx="2" />
    <text className="tag-text" x="470" y="330" textAnchor="middle">
      RENDER
    </text>
    <text className="name" x="512" y="352" textAnchor="middle">
      Custom
    </text>
    <text className="sub" x="512" y="367" textAnchor="middle">
      AppField → render
    </text>
    <rect className="mask" x="632" y="120" width="136" height="64" rx="6" />
    <rect className="node-ext" x="632" y="120" width="136" height="64" rx="6" />
    <rect className="tag-ext" x="640" y="128" width="40" height="14" rx="2" />
    <text className="tag-text-ext" x="660" y="138" textAnchor="middle">
      LEVEL
    </text>
    <text className="name-ext" x="700" y="160" textAnchor="middle">
      Nested level
    </text>
    <text className="sub-ext" x="700" y="175" textAnchor="middle">
      address.zip
    </text>
    <rect className="mask" x="632" y="216" width="136" height="64" rx="6" />
    <rect className="node-ext" x="632" y="216" width="136" height="64" rx="6" />
    <rect className="tag-ext" x="640" y="224" width="60" height="14" rx="2" />
    <text className="tag-text-ext" x="670" y="234" textAnchor="middle">
      PER ITEM
    </text>
    <text className="name-ext" x="700" y="256" textAnchor="middle">
      Item entries
    </text>
    <text className="sub-ext" x="700" y="271" textAnchor="middle">
      contacts[0].name
    </text>
  </Diagram>
)
