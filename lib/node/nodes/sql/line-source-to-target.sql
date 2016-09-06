SELECT
  ST_Length(the_geom) as length,
  the_geom,
  {{=it.final_columns}}
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
) {{=it.final_alias}}
