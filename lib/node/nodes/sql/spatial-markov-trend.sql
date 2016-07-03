SELECT
  input_query.*,
  m.trend,
  m.trend_up,
  m.trend_down,
  m.volatility
FROM cdb_crankshaft.CDB_SpatialMarkovTrend('{{=it._query}}', Array[{{=it._time_columns}}], {{=it._num_classes}}, '{{=it._weight_type}}', {{=it._num_ngbrs}}, {{=it._permutations}}, '{{=it._geom_col}}', '{{=it._id_col}}') As m
JOIN ({{=it._query}}) input_query
ON input_query.cartodb_id = m.rowid
