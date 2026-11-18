package com.fsieng.content.domain;

/** Result of one import run: how many items were stored and how many learners can see. */
public record ContentImportReport(int imported, int published) {}
