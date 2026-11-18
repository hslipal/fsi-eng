package com.fsieng.content.application.port.in;

import com.fsieng.content.domain.ContentImportReport;

public interface ImportContentUseCase {

  /** Reads every reviewed content file and stores it; drafts are skipped. */
  ContentImportReport importAll();
}
