WITH
_cdb_analysis_source_points AS (
  {{=it.pointsQuery}}
),
_cdb_analysis_isochrones AS (
  SELECT
    cdb_dataservices_client.{{=it.provider_function}}(
      _cdb_analysis_source_points.the_geom,
      '{{=it.kind}}',
      ARRAY[{{=it.isolines}}]::integer[]
    ) as isochrone,
    {{=it.columnsQuery}}
  FROM _cdb_analysis_source_points
)
SELECT
  (isochrone).center,
  (isochrone).data_range,
  (isochrone).the_geom,
  {{=it.columnsQuery}}
FROM _cdb_analysis_isochrones
