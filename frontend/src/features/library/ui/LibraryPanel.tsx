import { useState, type ReactElement } from 'react';
import { LICENSE_LABELS, TRACK_LABELS, TRACKS, type Track } from '../model/contentItem';
import { useContentItems, type ContentState } from '../model/useContentItems';

export function LibraryPanel(): ReactElement {
  const [track, setTrack] = useState<Track>('business');
  const state = useContentItems(track);

  return (
    <section aria-labelledby="library-title">
      <h2 id="library-title">素材库</h2>
      <div role="tablist" aria-label="赛道">
        {TRACKS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            role="tab"
            aria-selected={candidate === track}
            onClick={() => {
              setTrack(candidate);
            }}
          >
            {TRACK_LABELS[candidate]}
          </button>
        ))}
      </div>
      <ContentBody state={state} />
    </section>
  );
}

function ContentBody({ state }: { readonly state: ContentState }): ReactElement {
  switch (state.kind) {
    case 'loading':
      return <p role="status">加载中…</p>;
    case 'error':
      return <p role="alert">素材加载失败：{state.message}</p>;
    case 'ready':
      if (state.items.length === 0) {
        return <p>这个赛道还没有已发布的素材。</p>;
      }
      return (
        <ul aria-label="已发布素材">
          {state.items.map((item) => (
            <li key={item.id}>
              {item.title} · {item.level} · {LICENSE_LABELS[item.license]}
            </li>
          ))}
        </ul>
      );
  }
}
