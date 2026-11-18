package com.fsieng.content.application.port.out;

import com.fsieng.content.domain.ContentItem;
import com.fsieng.content.domain.Track;
import java.util.List;

public interface LoadContentPort {

  List<ContentItem> loadByTrack(Track track);
}
