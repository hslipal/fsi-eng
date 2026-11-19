package com.fsieng.content.application.port.in;

import com.fsieng.content.domain.SampleAudio;
import com.fsieng.content.domain.SpeakingPromptRef;
import com.fsieng.content.domain.Subtitles;
import java.util.List;

public interface SpeakingPromptsUseCase {

  /** IELTS speaking questions learners may use (dev-only ones only when enabled). */
  List<SpeakingPromptRef> list();

  /** The sample answer of a question; throws ContentNotFoundException if there is none. */
  SampleAudio sample(String key);

  /**
   * The subtitles of a question's sample answer; throws ContentNotFoundException if there are none.
   */
  Subtitles subtitles(String key);
}
