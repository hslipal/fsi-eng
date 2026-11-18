import { useState, type ReactElement } from 'react';
import { DrillPanel } from '@/features/drills';
import { IeltsPanel } from '@/features/ielts';
import { LibraryPanel } from '@/features/library';

type Section = 'drills' | 'ielts' | 'library';

const SECTIONS: readonly { readonly id: Section; readonly label: string }[] = [
  { id: 'drills', label: '句型操练' },
  { id: 'ielts', label: '雅思写作与口语' },
  { id: 'library', label: '素材库' },
];

export function App(): ReactElement {
  const [section, setSection] = useState<Section>('drills');

  return (
    <div className="shell">
      <header className="rail">
        <h1 className="brand">FSI-Eng 英语操练</h1>
        <p className="brand-note">商务、IT 职场和雅思的句型操练</p>
        <nav className="rail-nav" aria-label="板块">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="rail-link"
              aria-current={item.id === section ? 'page' : undefined}
              onClick={() => {
                setSection(item.id);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="main">
        {section === 'drills' ? <DrillPanel /> : null}
        {section === 'ielts' ? <IeltsPanel /> : null}
        {section === 'library' ? <LibraryPanel /> : null}
      </main>
    </div>
  );
}
