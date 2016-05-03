SELECT
  {{=it.columns}},
  CDB_Population(the_geom) as {{=it.final_column}}
FROM (
  {{=it.source}}
) _camshaft_population_in_area
