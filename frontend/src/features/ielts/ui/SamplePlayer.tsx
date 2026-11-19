import { useEffect, useRef, useState, type ReactElement, type RefObject } from 'react';
import { sampleUrl, type SpeakingPrompt } from '../model/assessment';
import { activeLine, type SubtitleLayers, type SubtitleLine } from '../model/subtitles';
import { useSubtitles } from '../model/useSubtitles';

interface PlayerProps {
  readonly prompt: SpeakingPrompt;
  readonly layers: SubtitleLayers;
  readonly onLayers: (layers: SubtitleLayers) => void;
}

/** The sample answer with subtitles that follow the audio; each layer can be shown or hidden. */
export function SamplePlayer({ prompt, layers, onLayers }: PlayerProps): ReactElement {
  const audio = useRef<HTMLAudioElement>(null);
  const [seconds, setSeconds] = useState(0);
  const subtitles = useSubtitles(prompt.key);
  const length = prompt.sampleSeconds === null ? '' : `（${prompt.sampleSeconds.toFixed(0)} 秒）`;
  return (
    <figure className="sample">
      <figcaption>示范回答{length}</figcaption>
      <audio
        ref={audio}
        controls
        preload="none"
        src={sampleUrl(prompt)}
        aria-label="示范回答"
        onTimeUpdate={(event) => {
          setSeconds(event.currentTarget.currentTime);
        }}
      />
      {subtitles.kind === 'ready' ? (
        <Subtitles
          lines={subtitles.lines}
          seconds={seconds}
          layers={layers}
          onLayers={onLayers}
          audio={audio}
        />
      ) : null}
      {subtitles.kind === 'none' ? <p className="subtitle-note">这段示范回答还没有字幕。</p> : null}
      {subtitles.kind === 'error' ? (
        <p className="subtitle-note">字幕加载失败：{subtitles.message}</p>
      ) : null}
    </figure>
  );
}

function LayerToggles({
  layers,
  onLayers,
}: Pick<PlayerProps, 'layers' | 'onLayers'>): ReactElement {
  return (
    <div className="subtitle-layers" role="group" aria-label="字幕图层">
      <button
        type="button"
        className="layer-toggle"
        aria-pressed={layers.english}
        onClick={() => {
          onLayers({ ...layers, english: !layers.english });
        }}
      >
        英文字幕
      </button>
      <button
        type="button"
        className="layer-toggle"
        aria-pressed={layers.chinese}
        onClick={() => {
          onLayers({ ...layers, chinese: !layers.chinese });
        }}
      >
        中文翻译
      </button>
    </div>
  );
}

interface SubtitlesProps extends Pick<PlayerProps, 'layers' | 'onLayers'> {
  readonly lines: readonly SubtitleLine[];
  readonly seconds: number;
  readonly audio: RefObject<HTMLAudioElement | null>;
}

function Subtitles({ lines, seconds, layers, onLayers, audio }: SubtitlesProps): ReactElement {
  const current = activeLine(lines, seconds);
  const box = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = box.current;
    const line = list?.children[current];
    if (list !== null && line instanceof HTMLElement) {
      list.scrollTop = line.offsetTop - list.offsetTop - list.clientHeight / 3;
    }
  }, [current]);
  const hidden = !layers.english && !layers.chinese;
  return (
    <div className="subtitles">
      <LayerToggles layers={layers} onLayers={onLayers} />
      {hidden ? (
        <p className="subtitle-note">字幕已隐藏，点上面的按钮显示。</p>
      ) : (
        <ol className="subtitle-lines" ref={box} aria-label="字幕">
          {lines.map((line, index) => (
            <li
              key={`${String(line.start)}:${String(index)}`}
              aria-current={index === current ? 'true' : undefined}
            >
              <button
                type="button"
                className="subtitle-line"
                onClick={() => {
                  const player = audio.current;
                  if (player !== null) {
                    player.currentTime = line.start;
                    void player.play();
                  }
                }}
              >
                {layers.english ? (
                  <span className="subtitle-en" lang="en">
                    {line.text}
                  </span>
                ) : null}
                {layers.chinese ? (
                  <span className="subtitle-zh">{line.translation ?? '（这一句还没有翻译）'}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
