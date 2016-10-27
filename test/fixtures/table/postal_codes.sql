CREATE TABLE postal_codes (
    cartodb_id integer NOT NULL,
    the_geom geometry(Geometry,4326),
    the_geom_webmercator geometry(Geometry,3857),
    code text
);

ALTER TABLE ONLY postal_codes
    ADD CONSTRAINT postal_codes_pkey PRIMARY KEY (cartodb_id);

CREATE INDEX postal_codes_the_geom_idx ON postal_codes USING gist (the_geom);

CREATE INDEX postal_codes_the_geom_webmercator_idx ON postal_codes USING gist (the_geom_webmercator);
