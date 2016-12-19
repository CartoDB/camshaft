CREATE OR REPLACE FUNCTION cdb_dataservices_client._cdb_route_point_to_point_exception_safe(origin GEOMETRY, destination GEOMETRY, mode TEXT, options TEXT[], units TEXT, OUT duration integer, OUT length real, OUT the_geom geometry)
AS $$
  SELECT
    trunc(random() * 1000)::integer duration,
    ST_Distance(origin, destination)::real length,
    ST_MakeLine(origin, destination) the_geom
$$ LANGUAGE 'sql' IMMUTABLE STRICT;
