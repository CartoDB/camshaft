WITH
input_query as (
  {{=it._query}}
),
moran as (
  SELECT * FROM
  cdb_crankshaft.cdb_moran_local_rate(
    '{{=it._query}}'
    '{{=it._numeratorColumn}}'
    '{{=it._denominatorColumn}}'
    {{=it._significance}},
    {{=it._neighbours}},
    {{=it._permutations}},
    'the_geom'
    'cartodb_id'
    '{{=it._wType}}'
  )
)
SELECT input_query.*, moran.*
FROM input_query JOIN moran
ON moran.ids = input_query.cartodb_id
