import type { ReactElement } from 'react';
import { DrillPanel } from '@/features/drills';
import { IeltsPanel } from '@/features/ielts';
import { LibraryPanel } from '@/features/library';

export function App(): ReactElement {
  return (
    <main>
      <h1>FSI-Eng 英语操练</h1>
      <DrillPanel />
      <IeltsPanel />
      <LibraryPanel />
    </main>
  );
}
