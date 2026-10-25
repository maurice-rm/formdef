import type { ReactNode } from 'react'

import { arrowOf, Diagram } from '../diagram'

const ID = 'building-blocks'

const ARROW = arrowOf(ID)

const DESCRIPTION =
  'The schema, the config and the registry go into createForm, which checks the config and returns a component. That component creates a TanStack form with useAppForm and renders Fields, which hands each widget its field as a prop; the widget writes values back through handleChange.'

export const BuildingBlocksDiagram = (): ReactNode => (
  <Diagram
    id={ID}
    title="The building blocks of a formdef form"
    description={DESCRIPTION}
    width={768}
    height={456}
  >
    <path
      className="wire"
      d="M 168,168 H 184 Q 192,168 192,176 V 256 Q 192,264 200,264 H 216"
      markerEnd={ARROW}
    />
    <line className="wire" x1="168" y1="280" x2="216" y2="280" markerEnd={ARROW} />
    <path
      className="wire"
      d="M 168,392 H 184 Q 192,392 192,384 V 304 Q 192,296 200,296 H 216"
      markerEnd={ARROW}
    />
    <line className="wire" x1="360" y1="280" x2="408" y2="280" markerEnd={ARROW} />
    <line className="wire" x1="480" y1="248" x2="480" y2="88" markerEnd={ARROW} />
    <line className="wire" x1="480" y1="312" x2="480" y2="360" markerEnd={ARROW} />
    <line className="wire" x1="552" y1="392" x2="600" y2="392" markerEnd={ARROW} />
    <line className="wire" x1="672" y1="360" x2="672" y2="88" markerEnd={ARROW} />
    <rect className="mask" x="488" y="161" width="80" height="14" rx="2" />
    <text className="label" x="528" y="172" textAnchor="middle">
      USEAPPFORM
    </text>
    <rect className="mask" x="488" y="329" width="56" height="14" rx="2" />
    <text className="label" x="516" y="340" textAnchor="middle">
      RENDERS
    </text>
    <rect className="mask" x="572" y="217" width="92" height="14" rx="2" />
    <text className="label" x="618" y="228" textAnchor="middle">
      HANDLECHANGE
    </text>
    <rect className="mask" x="24" y="136" width="144" height="64" rx="6" />
    <rect className="node" x="24" y="136" width="144" height="64" rx="6" />
    <rect className="tag" x="32" y="144" width="40" height="14" rx="2" />
    <text className="tag-text" x="52" y="154" textAnchor="middle">
      YOURS
    </text>
    <text className="name" x="96" y="176" textAnchor="middle">
      Schema
    </text>
    <text className="sub" x="96" y="191" textAnchor="middle">
      Standard Schema
    </text>
    <rect className="mask" x="24" y="248" width="144" height="64" rx="6" />
    <rect className="node" x="24" y="248" width="144" height="64" rx="6" />
    <rect className="tag" x="32" y="256" width="40" height="14" rx="2" />
    <text className="tag-text" x="52" y="266" textAnchor="middle">
      YOURS
    </text>
    <text className="name" x="96" y="288" textAnchor="middle">
      Config
    </text>
    <text className="sub" x="96" y="303" textAnchor="middle">
      fields · layout
    </text>
    <rect className="mask" x="24" y="360" width="144" height="64" rx="6" />
    <rect className="node" x="24" y="360" width="144" height="64" rx="6" />
    <rect className="tag" x="32" y="368" width="40" height="14" rx="2" />
    <text className="tag-text" x="52" y="378" textAnchor="middle">
      YOURS
    </text>
    <text className="name" x="96" y="400" textAnchor="middle">
      Registry
    </text>
    <text className="sub" x="96" y="415" textAnchor="middle">
      widgets · slots
    </text>
    <rect className="mask" x="216" y="248" width="144" height="64" rx="6" />
    <rect className="node-focal" x="216" y="248" width="144" height="64" rx="6" />
    <rect className="tag-focal" x="224" y="256" width="52" height="14" rx="2" />
    <text className="tag-text-focal" x="250" y="266" textAnchor="middle">
      FORMDEF
    </text>
    <text className="name-focal" x="288" y="288" textAnchor="middle">
      createForm
    </text>
    <text className="sub-focal" x="288" y="303" textAnchor="middle">
      checks the config
    </text>
    <rect className="mask" x="408" y="248" width="144" height="64" rx="6" />
    <rect className="node" x="408" y="248" width="144" height="64" rx="6" />
    <rect className="tag" x="416" y="256" width="52" height="14" rx="2" />
    <text className="tag-text" x="442" y="266" textAnchor="middle">
      FORMDEF
    </text>
    <text className="name" x="480" y="288" textAnchor="middle">
      Component
    </text>
    <text className="sub" x="480" y="303" textAnchor="middle">
      {'<SignInForm />'}
    </text>
    <rect className="mask" x="408" y="24" width="336" height="64" rx="6" />
    <rect className="node-ext" x="408" y="24" width="336" height="64" rx="6" />
    <rect className="tag-ext" x="416" y="32" width="60" height="14" rx="2" />
    <text className="tag-text-ext" x="446" y="42" textAnchor="middle">
      TANSTACK
    </text>
    <text className="name-ext" x="576" y="64" textAnchor="middle">
      TanStack Form
    </text>
    <text className="sub-ext" x="576" y="79" textAnchor="middle">
      values · validation · submit
    </text>
    <rect className="mask" x="408" y="360" width="144" height="64" rx="6" />
    <rect className="node" x="408" y="360" width="144" height="64" rx="6" />
    <rect className="tag" x="416" y="368" width="52" height="14" rx="2" />
    <text className="tag-text" x="442" y="378" textAnchor="middle">
      FORMDEF
    </text>
    <text className="name" x="480" y="400" textAnchor="middle">
      Fields
    </text>
    <text className="sub" x="480" y="415" textAnchor="middle">
      render loop
    </text>
    <rect className="mask" x="600" y="360" width="144" height="64" rx="6" />
    <rect className="node" x="600" y="360" width="144" height="64" rx="6" />
    <rect className="tag" x="608" y="368" width="40" height="14" rx="2" />
    <text className="tag-text" x="628" y="378" textAnchor="middle">
      YOURS
    </text>
    <text className="name" x="672" y="400" textAnchor="middle">
      Widget
    </text>
    <text className="sub" x="672" y="415" textAnchor="middle">
      {'FieldOf<V>'}
    </text>
  </Diagram>
)
