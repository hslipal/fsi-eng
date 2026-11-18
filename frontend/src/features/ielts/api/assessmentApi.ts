import { postForm, postJson } from '@/shared/api/httpClient';
import { AssessmentSchema, type Assessment, type WritingTask } from '../model/assessment';

export async function assessWriting(
  task: WritingTask,
  prompt: string,
  essay: string,
): Promise<Assessment> {
  return await postJson('/api/assessment/writing', { task, prompt, essay }, AssessmentSchema);
}

export async function assessSpeaking(
  part: number,
  question: string,
  audio: File,
): Promise<Assessment> {
  const form = new FormData();
  form.append('part', String(part));
  form.append('question', question);
  form.append('audio', audio);
  return await postForm('/api/assessment/speaking', form, AssessmentSchema);
}
