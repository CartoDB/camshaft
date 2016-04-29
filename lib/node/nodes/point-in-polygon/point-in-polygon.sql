WITH
_cdb_analysis_points AS (
  {{=it.pointsQuery}}
),
_cdb_analysis_polygons AS (
  {{=it.polygonsQuery}}
)
SELECT {{=it.pointsColumns}}
FROM _cdb_analysis_points
JOIN _cdb_analysis_polygons
ON ST_Contains(_cdb_analysis_polygons.the_geom, _cdb_analysis_points.the_geom)
