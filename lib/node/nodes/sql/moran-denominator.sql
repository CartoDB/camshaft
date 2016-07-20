SELECT input_query.*, m.quads, m.significance, m.moran
FROM ({{=it._query}}) input_query,
(
  SELECT * FROM
  cdb_crankshaft.CDB_AreasOfInterestLocalRate(
    '{{=it._query}}',
    '{{=it._numeratorColumn}}',
    '{{=it._denominatorColumn}}',
    '{{=it._wType}}',
    {{=it._neighbours}},
    {{=it._permutations}},
    'the_geom',
    'cartodb_id'
  )
) m
WHERE m.rowid = input_query.cartodb_id
