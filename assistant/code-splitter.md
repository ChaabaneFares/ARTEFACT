when asked to code split do it according to 

1. STYLE SEPARATION
Input: React/Solid component with inline styles
Output: 
- Clean component with CSS modules
- Separate .module.css file
- Dynamic styles retained inline

CSS Formatting Rules:
- One line per class/selector
- No line breaks within declarations
- Space after colon in properties
- No space before colon
- Semi-colon after each declaration 
- Single quotes for string values
- Space after comma in values
- No trailing semi-colon on last property

Example Format:
.className { color: #000; font-size: 16px; background: linear-gradient(to right, #fff, #000); }

Rules:
- Extract all static styles to .module.css
- Keep dynamic styles inline
- Maintain identical visual output
- Use minimum class names
- Leverage CSS selectors
- Icons can have classNames
Example Input:


const Card = ({ selected, title }) => (
  <div style={{ padding: '20px', background: '#fff', borderRadius: '8px' }}>
    <h2 style={{ fontSize: '24px', color: selected ? 'blue' : 'black' }}>{title}</h2>
    <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
      <span style={{ color: '#666' }}>Content</span>
    </div>
  </div>
)

Example Output:
card.tsx:

import styles from './card.module.css'

const Card = ({ selected, title }) => (
  <div className={styles.card}>
    <h2 className={styles.title} style={{ color: selected ? 'blue' : 'black' }}>{title}</h2>
    <div className={styles.content}>
      <span className={styles.text}>Content</span>
    </div>
  </div>
)

card.module.css:

.card { padding: 20px; background: #fff; border-radius: 8px; }
.title { font-size: 24px; }
.content { display: flex; gap: 10px; margin-top: 16px; }
.text { color: #666; }

2. LOGIC SEPARATION
Input: Component with mixed rendering and logic
Output:

.Clean component file (.tsx)
.Separate logic file (.logic.ts)
.Custom hook for logic export

Important: Each component owns its own logic file.
- Never stack subcomponent logic into a parent's .logic.ts file.
- Every component that has logic (state, handlers, effects) must have its own
  dedicated <component-name>.logic.ts next to its .tsx file.
- The parent .logic.ts only contains logic that belongs to the parent itself.
- This keeps each component self-contained and makes code-splitting effective
  (bundlers can tree-shake and lazy-load per component).

Example Input:

const Card = () => {
  const [selected, setSelected] = useState(false)
  const [title, setTitle] = useState('')
  
  const handleSelect = () => {
    setSelected(!selected)
  }
  
  const updateTitle = (newTitle) => {
    setTitle(newTitle)
  }

  return (
    <div onClick={handleSelect}>
      <h2>{title}</h2>
    </div>
  )
}

Example Output:
card.tsx:

import { useCardLogic } from './card.logic'

const Card = () => {
  const { selected, title, handleSelect, updateTitle } = useCardLogic()

  return (
    <div onClick={handleSelect}>
      <h2>{title}</h2>
    </div>
  )
}

card.logic.ts:

export function useCardLogic() {
  const [selected, setSelected] = useState(false)
  const [title, setTitle] = useState('')
  
  const handleSelect = () => {
    setSelected(!selected)
  }
  
  const updateTitle = (newTitle) => {
    setTitle(newTitle)
  }

  return {
    selected,
    title, 
    handleSelect,
    updateTitle
  }
}

3. COMPONENT ISOLATION
Input: A parent component with subcomponents in a flat `components/` folder,
       where all logic lives in the parent's .logic.ts
Output:
- Each subcomponent in its own folder inside `components/`
- Each subcomponent with its own `.logic.ts`, `.module.css` as needed
- Parent `.logic.ts` only keeps parent-level logic

Anti-pattern (❌ stacked logic):
```
question-view/
  question-view.logic.ts   ← contains logic for itself AND all children
  components/
    question-view-side-panel.tsx   ← no own logic file, depends on parent
    question-view-news-section.tsx ← no own logic file, depends on parent
```

Correct pattern (✅ isolated logic):
```
question-view/
  question-view.logic.ts   ← only parent-level logic
  components/
    question-view-side-panel/
      question-view-side-panel.tsx
      question-view-side-panel.logic.ts
      question-view-side-panel.module.css
    question-view-news-section/
      question-view-news-section.tsx
      question-view-news-section.logic.ts
```

Rules:
- Every component that has state, handlers, or effects gets its own .logic.ts
- The parent passes only the minimal props each child needs
- Children never import from the parent's .logic.ts directly
- This enables effective code-splitting, lazy-loading, and testability

Validation:

.Visual output matches original
.No static styles remain inline
.Dynamic styles preserved inline
.CSS formatted single-line with proper spacing
.Logic fully separated into custom hook
.Component only contains TSX and logic hook usage
.Each subcomponent has its own folder and .logic.ts file
.Parent .logic.ts contains only parent-level concerns

These instructions now include:
- Specific CSS formatting rules
- Complete working examples
- Clear input/output patterns
- Component isolation rules
- Validation criteria