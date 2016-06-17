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

---- cdb_geocode_ipaddress_point(ip text)
CREATE OR REPLACE FUNCTION cdb_geocode_ipaddress_point(ip text)
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
