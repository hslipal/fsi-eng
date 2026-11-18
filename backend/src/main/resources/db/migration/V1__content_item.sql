-- Content items. Portable SQL: runs on PostgreSQL and on H2 in PostgreSQL mode.
CREATE TABLE content_item (
    id             UUID          PRIMARY KEY,
    track          VARCHAR(16)   NOT NULL,
    title          VARCHAR(500)  NOT NULL,
    source_url     VARCHAR(2000),
    license_kind   VARCHAR(32)   NOT NULL,
    license_detail VARCHAR(500),
    item_level     VARCHAR(32)   NOT NULL,
    reviewed_by    VARCHAR(100)
);

CREATE INDEX content_item_track_idx ON content_item (track);
