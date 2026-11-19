import type { ReactElement } from 'react';
import { STEP_LABELS } from '../model/lesson';
import { summarize, type TurnResult } from '../model/rhythm';

export function Summary({
  results,
  limitSeconds,
}: {
  readonly results: readonly TurnResult[];
  readonly limitSeconds: number;
}): ReactElement {
  const rows = summarize(results);
  return (
    <div className="rhythm-summary">
      <h3>这一课练完了</h3>
      <table>
        <caption>每种练习的结果（反应时间从提示读完算到你说完，限时 {limitSeconds} 秒）</caption>
        <thead>
          <tr>
            <th scope="col">练习</th>
            <th scope="col">次数</th>
            <th scope="col">正确</th>
            <th scope="col">接近</th>
            <th scope="col">不对</th>
            <th scope="col">超时</th>
            <th scope="col">平均反应</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.type}>
              <th scope="row">{STEP_LABELS[row.type]}</th>
              <td>{row.total}</td>
              <td>{row.correct}</td>
              <td>{row.close}</td>
              <td>{row.wrong}</td>
              <td>{row.slow}</td>
              <td>{row.averageSeconds === null ? '—' : `${row.averageSeconds.toFixed(1)} 秒`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="rhythm-note">答错或超时的句子会进入「句型操练」的复习队列，过几天再练。</p>
    </div>
  );
}
