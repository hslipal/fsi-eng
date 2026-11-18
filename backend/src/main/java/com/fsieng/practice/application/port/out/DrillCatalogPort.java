package com.fsieng.practice.application.port.out;

import com.fsieng.practice.domain.CardKey;
import com.fsieng.practice.domain.PracticeItem;
import java.util.List;
import java.util.Optional;

/** Published, auto-gradable drill items (owned by the content module). */
public interface DrillCatalogPort {

  List<PracticeItem> itemsFor(String track);

  Optional<PracticeItem> find(CardKey key);
}
