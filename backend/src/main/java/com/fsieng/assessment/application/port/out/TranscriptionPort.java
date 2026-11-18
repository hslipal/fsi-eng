package com.fsieng.assessment.application.port.out;

import com.fsieng.assessment.domain.AudioClip;

/** Speech-to-text. Implemented only in adapter.out.asr. */
public interface TranscriptionPort {

  String transcribe(AudioClip recording);
}
