SELECT
  {{=it.columns}},
  ST_Buffer(the_geom::geography, {{=it.radius}})::geometry the_geom
FROM (
  {{=it.source}}
) _camshaft_buffer
