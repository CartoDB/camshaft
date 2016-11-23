SELECT
  *,
  ST_Length(the_geom::geography) AS length
FROM (
  SELECT
    {{=it.target_alias}}.cartodb_id as closest_id,
    ST_MakeLine(
      {{=it.source_alias}}.the_geom,
      {{=it.target_alias}}.the_geom
    ) AS the_geom,
    {{=it.source_columns}}
  FROM (
    SELECT DISTINCT ON (the_geom)
      *
    FROM (
      {{=it.source}}
    ) _source
  ) {{=it.source_alias}}
  CROSS JOIN LATERAL (
    SELECT
      *
    FROM (
      {{=it.target}}
    ) _target
    ORDER BY
      {{=it.source_alias}}.the_geom <-> the_geom
    LIMIT 1
  ) {{=it.target_alias}}
  {{? it.source_column && it.target_column}}
  WHERE
    {{=it.source_alias}}.{{=it.source_column}} = {{=it.target_alias}}.{{=it.target_column}}
  {{?}}
) _cdb_analysis_lines
