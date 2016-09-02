SELECT
  *,
  ST_Length(the_geom) as length
FROM (
  SELECT
    target.cartodb_id as closest_id,
    ST_MakeLine(
      source.the_geom,
      target.the_geom
    ) AS the_geom,
    {{=it.source_columns}}
  FROM (
    SELECT DISTINCT ON (the_geom)
      *
    FROM (
      {{=it.source}}
    ) _source
  ) source
  CROSS JOIN LATERAL (
    SELECT
      *
    FROM (
      {{=it.target}}
    ) _target
    ORDER BY
      source.the_geom <-> the_geom
    LIMIT 1
  ) target
  {{? it.source_column && it.target_column}}
  WHERE
    source.{{=it.source_column}} = target.{{=it.target_column}}
  {{?}}
) _cdb_analysis_lines
