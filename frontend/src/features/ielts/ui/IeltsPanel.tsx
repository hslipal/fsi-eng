import { useState, type ReactElement } from 'react';
import { useAssessment, type AssessmentState } from '../model/useAssessment';
import { ScoreCard } from './ScoreCard';
import { SpeakingForm } from './SpeakingForm';
import { WritingForm } from './WritingForm';

type Skill = 'writing' | 'speaking';

export function IeltsPanel(): ReactElement {
  const [skill, setSkill] = useState<Skill>('writing');
  const writing = useAssessment();
  const speaking = useAssessment();
  const current = skill === 'writing' ? writing : speaking;

  return (
    <section className="panel" aria-labelledby="ielts-title">
      <h2 id="ielts-title">雅思写作与口语估分</h2>
      <p className="panel-lead">
        写一篇作文或上传一段录音，AI 按雅思的评分维度给出估计分和修改建议。
      </p>
      <div className="tabs" role="tablist" aria-label="雅思技能">
        <SkillTab skill="writing" label="写作" active={skill} onSelect={setSkill} />
        <SkillTab skill="speaking" label="口语" active={skill} onSelect={setSkill} />
      </div>
      {skill === 'writing' ? (
        <WritingForm assessment={writing} />
      ) : (
        <SpeakingForm assessment={speaking} />
      )}
      <Result state={current.state} />
    </section>
  );
}

interface SkillTabProps {
  readonly skill: Skill;
  readonly label: string;
  readonly active: Skill;
  readonly onSelect: (skill: Skill) => void;
}

function SkillTab({ skill, label, active, onSelect }: SkillTabProps): ReactElement {
  return (
    <button
      type="button"
      role="tab"
      className="tab"
      aria-selected={skill === active}
      onClick={() => {
        onSelect(skill);
      }}
    >
      {label}
    </button>
  );
}

function Result({ state }: { readonly state: AssessmentState }): ReactElement | null {
  switch (state.kind) {
    case 'idle':
      return null;
    case 'scoring':
      return (
        <p className="status" role="status">
          AI 正在估分，通常需要十几秒…
        </p>
      );
    case 'error':
      return (
        <p className="alert" role="alert">
          估分失败：{state.message}
        </p>
      );
    case 'scored':
      return <ScoreCard result={state.result} />;
  }
}
