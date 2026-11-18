import { useState, type ReactElement } from 'react';
import { LICENSE_LABELS, TRACK_LABELS, TRACKS, type Track } from '../model/contentItem';
import { useContentItems, type ContentState } from '../model/useContentItems';

export function LibraryPanel(): ReactElement {
  const [track, setTrack] = useState<Track>('business');
  const state = useContentItems(track);

  return (
    <section className="panel" aria-labelledby="library-title">
      <h2 id="library-title">素材库</h2>
      <p className="panel-lead">已审核发布的素材。每份素材里的操练题都会出现在句型操练中。</p>
      <div className="tabs" role="tablist" aria-label="赛道">
        {TRACKS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            role="tab"
            className="tab"
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
      return (
        <p className="status" role="status">
          加载中…
        </p>
      );
    case 'error':
      return (
        <p className="alert" role="alert">
          素材加载失败：{state.message}
        </p>
      );
    case 'ready':
      if (state.items.length === 0) {
        return <p className="empty">这个赛道还没有已发布的素材。</p>;
      }
      return (
        <ul className="library-list" aria-label="已发布素材">
          {state.items.map((item) => (
            <li key={item.id} className="library-item">
              <span className="library-title">{item.title}</span>
              <span className="library-meta">{LICENSE_LABELS[item.license]}</span>
              <span className="library-level">{item.level}</span>
            </li>
          ))}
        </ul>
      );
  }
}
