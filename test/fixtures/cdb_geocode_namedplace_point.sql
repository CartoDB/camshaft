---- cdb_geocode_namedplace_point(city_name text, admin1_name text, country_name text)
CREATE OR REPLACE FUNCTION cdb_geocode_namedplace_point(city_name text, admin1_name text, country_name text)
RETURNS Geometry AS $$
  DECLARE
    ret Geometry;
  BEGIN
  SELECT the_geom INTO ret
  FROM (
      SELECT * FROM populated_places_simple WHERE name = city_name AND admin1_name = admin1_name AND adm0name = adm0name LIMIT 1
    ) v;
    RETURN ret;
  END
$$ LANGUAGE plpgsql;
