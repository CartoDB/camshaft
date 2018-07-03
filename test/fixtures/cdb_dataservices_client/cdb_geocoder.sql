---- _cdb_geocode_namedplace_point_exception_safe(city_name text, admin1_name text, country_name text)
CREATE OR REPLACE FUNCTION cdb_dataservices_client._cdb_geocode_namedplace_point_exception_safe(city_name text, admin1_name text, country_name text)
RETURNS Geometry AS $$
  DECLARE
    ret Geometry;
  BEGIN
  SELECT the_geom INTO ret
  FROM (
      SELECT * FROM populated_places_simple WHERE name = city_name AND adm1name = admin1_name AND adm0name = country_name LIMIT 1
    ) v;
    RETURN ret;
  END
$$ LANGUAGE plpgsql;

---- _cdb_geocode_admin1_polygon_exception_safe(admin1_name text, country_name text)
CREATE OR REPLACE FUNCTION cdb_dataservices_client._cdb_geocode_admin1_polygon_exception_safe(admin1_name text, country_name text)
RETURNS Geometry AS $$
  DECLARE
    ret Geometry;
  BEGIN
  SELECT
    ST_Transform(
      geometry(
        ST_Buffer(
          geography(
            ST_Transform(the_geom, 4326)
          ),
          50000
        )
      ),
      4326
    ) INTO ret
  FROM (
      SELECT * FROM populated_places_simple WHERE adm1name = admin1_name AND adm0name = country_name LIMIT 1
    ) v;
    RETURN ret;
  END
$$ LANGUAGE plpgsql;

---- _cdb_geocode_postalcode_polygon_exception_safe(postal_code text, country_name text)
CREATE OR REPLACE FUNCTION cdb_dataservices_client._cdb_geocode_postalcode_polygon_exception_safe(postal_code text, country_name text)
RETURNS Geometry AS $$
  DECLARE
    ret Geometry;
  BEGIN
  SELECT
    ST_Transform(
      geometry(
        ST_Buffer(
          geography(
            ST_Transform(the_geom, 4326)
          ),
          50000
        )
      ),
      4326
    ) INTO ret
  FROM (
      SELECT * FROM populated_places_simple WHERE cartodb_id::text = postal_code AND adm0name = country_name LIMIT 1
    ) v;
    RETURN ret;
  END
$$ LANGUAGE plpgsql;

---- _cdb_geocode_ipaddress_point_exception_safe(ip text)
CREATE OR REPLACE FUNCTION cdb_dataservices_client._cdb_geocode_ipaddress_point_exception_safe(ip text)
RETURNS Geometry AS $$
  DECLARE
    i INTEGER := 0;
    maxiter INTEGER := 10000;
    x0 DOUBLE PRECISION;
    dx DOUBLE PRECISION;
    y0 DOUBLE PRECISION;
    dy DOUBLE PRECISION;
    xp DOUBLE PRECISION;
    yp DOUBLE PRECISION;
    spain Geometry;
    rpoint Geometry;
  BEGIN
    SELECT the_geom INTO spain FROM world_borders WHERE name = 'Spain' LIMIT 1;
    -- find envelope
    x0 = ST_XMin(spain);
    dx = (ST_XMax(spain) - x0);
    y0 = ST_YMin(spain);
    dy = (ST_YMax(spain) - y0);

    WHILE i < maxiter LOOP
      i = i + 1;
      xp = x0 + dx * random();
      yp = y0 + dy * random();
      rpoint = ST_SetSRID( ST_MakePoint( xp, yp ), 4326 );
      EXIT WHEN ST_Within( rpoint, spain );
    END LOOP;

    IF i >= maxiter THEN
      rpoint = ST_Centroid(spain);
    END IF;

    RETURN rpoint;

  END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cdb_dataservices_client._cdb_geocode_street_point_exception_safe(searchtext TEXT, city TEXT DEFAULT NULL, state_province TEXT DEFAULT NULL, country TEXT DEFAULT NULL)
RETURNS Geometry AS $$
  SELECT CASE
    WHEN searchtext = 'W 26th Street' THEN ST_SetSRID(ST_MakePoint(-74.990425, 40.744131), 4326)
    WHEN searchtext = 'Madrid, Spain' THEN ST_SetSRID(ST_MakePoint(-3.669245, 40.429913), 4326)
    WHEN searchtext = 'Logroño, Argentina' THEN ST_SetSRID(ST_MakePoint(-61.69614, -29.50347), 4326)
    WHEN searchtext = 'Logroño, La Rioja, Spain' THEN ST_SetSRID(ST_MakePoint(-2.517555, 42.302939), 4326)
    ELSE ST_SetSRID(ST_MakePoint(0, 0), 4326)
    END;
$$
LANGUAGE SQL;

CREATE TYPE cdb_dataservices_client.geocoding AS (
    cartodb_id integer,
    the_geom geometry,
    metadata jsonb
);

DROP TABLE IF EXISTS geocoding_fixture;
CREATE TABLE geocoding_fixture (the_address text, the_geom geometry(Point, 4326));
insert into geocoding_fixture (the_address, the_geom) values
  ('W 26th Street', ST_SetSRID(ST_MakePoint(-74.990425, 40.744131), 4326)),
  ('street_name', ST_SetSRID(ST_MakePoint(-74.990425, 40.744131), 4326)),
  ('Madrid, Spain', ST_SetSRID(ST_MakePoint(-3.669245, 40.429913), 4326)),
  ('Puerta del Sol, Madrid, Spain', ST_SetSRID(ST_MakePoint(-3.669245, 40.429913), 4326)),
  ('Puerta del Sol', ST_SetSRID(ST_MakePoint(-3.669245, 40.429913), 4326)),
  ('Logroño, Argentina', ST_SetSRID(ST_MakePoint(-61.69614, -29.50347), 4326)),
  ('Logroño', ST_SetSRID(ST_MakePoint(-61.69614, -29.50347), 4326)),
  ('Plaza Mayor, Logroño, Argentina', ST_SetSRID(ST_MakePoint(-61.69614, -29.50347), 4326)),
  ('Plaza Mayor', ST_SetSRID(ST_MakePoint(-61.69614, -29.50347), 4326)),
  ('Plaza Mayor, Valladolid, Spain', ST_SetSRID(ST_MakePoint(-61.666, -29.555), 4326)),
  ('Logroño, La Rioja, Spain', ST_SetSRID(ST_MakePoint(-2.517555, 42.302939), 4326)),
  ('1900 amphitheatre parkway, mountain view, ca, us', ST_SetSRID(ST_MakePoint(-122.0875324, 37.4227968), 4326)),
  ('1900 amphitheatre parkway', ST_SetSRID(ST_MakePoint(-122.0875324, 37.4227968), 4326));

DROP TABLE IF EXISTS georeference_street_address_fixture;
CREATE TABLE georeference_street_address_fixture (cartodb_id INTEGER PRIMARY KEY , street_number text, street_name text, city text, state text, country text, the_geom geometry(Geometry, 4326));
insert into georeference_street_address_fixture (cartodb_id, street_number, street_name, city, state, country) values
  (1, null, 'W 26th Street', null , null , null),
  (2, null, null, 'Madrid', null , 'Spain'),
  (3, null, null, 'Logroño', null , 'Argentina'),
  (4, null, null, 'Logroño', 'La Rioja', 'Spain'),
  (5, null, '1900 amphitheatre parkway', 'mountain view', 'ca', 'us'),
  (6, null, 'Logroño', null, null, null),
  (7, null, 'Plaza Mayor', null, null, 'Spain'),
  (8, '2', 'Calle Santiago Rusiñol', null, null, null);

DROP TABLE IF EXISTS georeference_street_full_address_fixture;
CREATE TABLE georeference_street_full_address_fixture (cartodb_id INTEGER PRIMARY KEY , full_address text, the_geom geometry(Geometry, 4326));
insert into georeference_street_full_address_fixture (cartodb_id, full_address) values
  (1, 'W 26th Street'),
  (2, 'Puerta del Sol'),
  (3, 'Plaza Mayor'),
  (4, 'Logroño'),
  (5, '1900 amphitheatre parkway');

DROP TABLE IF EXISTS cdb_bulk_geocode_street_point_trace;
CREATE TABLE cdb_bulk_geocode_street_point_trace (
  query text,
  street_column text, city_column text, state_column text, country_column text,
  street_match text,
  created_at timestamp  default now());

CREATE OR REPLACE FUNCTION cdb_dataservices_client.cdb_bulk_geocode_street_point (query text,
    street_column text, city_column text default null, state_column text default null, country_column text default null, batch_size integer DEFAULT 100)
RETURNS SETOF cdb_dataservices_client.geocoding AS $$
DECLARE
  street_match text;
BEGIN

select string_agg(the_param, ' || '', '' || ')
from (
  select unnest(ARRAY[street_column, city_column, state_column, country_column]) as the_param
  ) _x
where _x.the_param is not null
into street_match;

insert into cdb_bulk_geocode_street_point_trace (
  query,
  street_column, city_column, state_column, country_column,
  street_match
) values (
  query,
  street_column, city_column, state_column, country_column,
  street_match
);

IF 'city || '''', '''' || state || '''', '''' || ''''Spain''''' = street_match -- Fixture for 'with several columns and free text'
OR '''''Logroño'''' || '''', '''' || ''''La Rioja'''' || '''', '''' || ''''Spain''''' = street_match -- Fixture for 'with only free text' and 'template with spaces in token'
OR 'city || '''', '''' || ''''La Rioja'''' || '''', '''' || ''''Spain''''' = street_match -- Fixture for 'with column and more free text'
OR 'city || '''', '''' || ''''Spain''''' = street_match -- Fixture for 'with column and free text'
OR 'city || '''', '''' || country' = street_match -- Fixture for 'with two columns'
THEN
  street_match := '''Logroño, La Rioja, Spain''';
ELSIF 'street_name' = street_match THEN -- Fixture for 'column' and 'basic template'
  street_match := '''street_name''';
END IF;

RETURN QUERY EXECUTE format('SELECT cartodb_id, f.the_geom, ''{}''::jsonb ' ||
 'FROM geocoding_fixture f inner join (%s) _x ON %s = f.the_address ',
 query, street_match);
END;
$$
LANGUAGE 'plpgsql';
