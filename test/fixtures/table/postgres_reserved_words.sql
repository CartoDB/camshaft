CREATE TABLE reserved_words (
    cartodb_id integer NOT NULL,
    the_geom geometry(Geometry,4326),
    the_geom_webmercator geometry(Geometry,3857),
    "window" text,
    "zone" text
);

ALTER TABLE ONLY reserved_words
    ADD CONSTRAINT reserved_words_pkey PRIMARY KEY (cartodb_id);

CREATE INDEX reserved_words_the_geom_idx ON reserved_words USING gist (the_geom);

CREATE INDEX reserved_words_the_geom_webmercator_idx ON reserved_words USING gist (the_geom_webmercator);
