---- cdb_geocode_namedplace_point(city_name text, admin1_name text, country_name text)
CREATE OR REPLACE FUNCTION cdb_geocode_namedplace_point(city_name text, admin1_name text, country_name text)
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

---- cdb_geocode_admin1_polygon(admin1_name text, country_name text)
CREATE OR REPLACE FUNCTION cdb_geocode_admin1_polygon(admin1_name text, country_name text)
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

---- cdb_geocode_postalcode_polygon(postal_code text, country_name text)
CREATE OR REPLACE FUNCTION cdb_geocode_postalcode_polygon(postal_code text, country_name text)
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
