WITH
_cdb_analysis_source_points AS (
  {{=it.pointsQuery}}
),
_cdb_analysis_isochrones AS (
  SELECT
    cdb_dataservices_client._cdb_isochrone_exception_safe(
      _cdb_analysis_source_points.the_geom,
      '{{=it.kind}}',
      ARRAY[{{=it.isolines}}]::integer[]
    ) as isochrone,
    _cdb_analysis_source_points.cartodb_id as source_cartodb_id,
    {{=it.columnsQuery}}
  FROM _cdb_analysis_source_points
)
SELECT
  row_number() over() as cartodb_id,
  (isochrone).center,
  (isochrone).data_range,
  (isochrone).the_geom,
  source_cartodb_id,
  {{=it.columnsQuery}}
FROM _cdb_analysis_isochrones
ORDER BY (isochrone).data_range DESC
