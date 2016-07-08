CREATE OR REPLACE FUNCTION cdb_dataservices_client.cdb_route_with_waypoints(
  waypoints geometry(Point, 4326)[],
  mode TEXT,
  options text[] DEFAULT ARRAY[]::text[],
  units text DEFAULT 'kilometers',
  OUT duration integer,
  OUT length real,
  OUT the_geom geometry)
AS $$
  SELECT
    trunc(random() * 1000)::integer duration,
    ST_Distance(waypoints[1], waypoints[array_length(waypoints, 1)])::real length,
    ST_MakeLine(waypoints) the_geom
$$ LANGUAGE 'sql' IMMUTABLE STRICT;
