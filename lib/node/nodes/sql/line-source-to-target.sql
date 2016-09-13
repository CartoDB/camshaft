SELECT
  *,
  ST_Length(the_geom::geography) / 1000 AS length
FROM (
  SELECT
    ST_MakeLine(
      {{=it.source_alias}}.the_geom,
      {{=it.target_alias}}.the_geom
    ) AS the_geom,
    {{=it.source_columns}}
  FROM (
    {{=it.source}}
  ) {{=it.source_alias}}, (
    {{=it.target}}
  ) {{=it.target_alias}}
  {{? it.source_column && it.target_column}}
  WHERE
    {{=it.source_alias}}.{{=it.source_column}} = {{=it.target_alias}}.{{=it.target_column}}
  {{?}}
) _cdb_analysis_lines
