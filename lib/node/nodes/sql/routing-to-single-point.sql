WITH
_cdb_analysis_source_points AS (
  {{=it.source}}
),
_cdb_analysis_routing AS (
  SELECT
    cdb_route_point_to_point(
      the_geom,
      ST_SetSRID(
        ST_MakePoint(
          {{=it.destination_longitude}},
          {{=it.destination_latitude}}
        ),
        4326
      ),
      '{{=it.mode}}',
      ARRAY['mode_type={{=it.mode_type}}']::text[],
      '{{=it.units}}'
    ) as route,
    {{=it.columns}}
  FROM _cdb_analysis_source_points
)
SELECT
  (route).duration,
  (route).length,
  (route).the_geom,
  {{=it.columns}}
FROM _cdb_analysis_routing
