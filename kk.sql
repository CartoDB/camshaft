SELECT
  ST_ExteriorRing(ST_Buffer('POINT(-3.70568 40.42028)'::geometry, _range.r))::geometry the_geom
FROM (
  SELECT unnest(ARRAY[1,3,4,6]) as r
) _range

SELECT
  1 as cartodb_id,
  ST_SetSRID(_l.geom, 4326) as the_geom,
  ST_SetSRID(_l.geom, 3857) as the_geom_webmercator
FROM (
  SELECT
    ST_Multi(
      ARRAY(
        SELECT
          ST_Buffer('POINT(-3.70568 40.42028)'::geometry, _range.radius)
        FROM (
          SELECT unnest(ARRAY[0.01, 0.02]) as radius
        ) _range
      )
    ) as geom
) _l

SELECT
  1 as cartodb_id,
  ST_SetSRID(_l.geom, 4326) as the_geom,
  ST_SetSRID(_l.geom, 3857) as the_geom_webmercator
FROM (
  SELECT
    ST_Multi(
      ST_Collect(
        geom
      )
    )
  FROM (
    SELECT
      ST_Buffer('POINT(-3.70568 40.42028)'::geometry, _t.radius)
    FROM (
      SELECT unnest(ARRAY[0.01, 0.02]) as radius
    ) _t
  ) _b
) _l

SELECT
  1 as cartodb_id,
  ST_SetSRID(_l.geom, 4326) as the_geom,
  ST_SetSRID(_l.geom, 3857) as the_geom_webmercator,
  ST_NumGeometries(_l.geom) as num_geometries
FROM (
  SELECT
    ST_Collect(
      _b.geom
    ) as geom
  FROM (
    SELECT
      ST_Buffer(ST_SetSRID('POINT(-3.70568 40.42028)'::geometry, 4326), _t.radius * 0.001) as geom
    FROM (
      SELECT unnest(ARRAY[100, 200]) as radius
    ) _t
  ) _b
) _l
