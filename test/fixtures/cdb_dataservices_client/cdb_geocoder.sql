---- _cdb_geocode_namedplace_point_exception_safe(city_name text, admin1_name text, country_name text)
CREATE OR REPLACE FUNCTION cdb_dataservices_client._cdb_geocode_namedplace_point_exception_safe(city_name text, admin1_name text, country_name text)
RETURNS Geometry AS $$
  DECLARE
    ret Geometry;
  BEGIN
  SELECT the_geom INTO ret
  FROM (
      SELECT st_setsrid(st_makepoint(10, 10), 4326)
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
      SELECT st_setsrid(st_makepoint(10, 10), 4326)
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
      SELECT st_setsrid(st_makepoint(10, 10), 4326)
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
  DECLARE
    ret Geometry;
  BEGIN
    SELECT st_setsrid(st_makepoint(10, 10), 4326) INTO ret;

    RETURN ret;
  END
$$ LANGUAGE plpgsql;
