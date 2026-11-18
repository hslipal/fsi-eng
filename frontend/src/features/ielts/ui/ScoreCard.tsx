import type { ReactElement } from 'react';
import { CRITERION_LABELS, type Assessment } from '../model/assessment';

/** An AI-estimated score. Always labelled as an estimate, always with the disclaimer. */
export function ScoreCard({ result }: { readonly result: Assessment }): ReactElement {
  return (
    <article aria-labelledby="score-title">
      <h3 id="score-title">AI 估计分数（非官方）</h3>
      <p>估计总分：{result.overallBand.toFixed(1)}</p>
      <ul aria-label="各项估计">
        {result.criteria.map((score) => (
          <li key={score.criterion}>
            {CRITERION_LABELS[score.criterion]}：{score.band.toFixed(1)} — {score.comment}
          </li>
        ))}
        {result.skill === 'speaking' && !result.pronunciationScored ? (
          <li>{CRITERION_LABELS.pronunciation}：未评分（语音转文字无法判断发音）</li>
        ) : null}
      </ul>
      <p>{result.summary}</p>
      {result.transcript === null ? null : <p>识别出的回答：{result.transcript}</p>}
      <p role="note">{result.disclaimer}</p>
    </article>
  );
}
