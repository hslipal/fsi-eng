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
    <section aria-labelledby="ielts-title">
      <h2 id="ielts-title">雅思写作与口语估分</h2>
      <div role="tablist" aria-label="雅思技能">
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
      return <p role="status">AI 正在估分…</p>;
    case 'error':
      return <p role="alert">估分失败：{state.message}</p>;
    case 'scored':
      return <ScoreCard result={state.result} />;
  }
}
