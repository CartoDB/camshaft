SELECT
  input_query.*,
  {{=it._ind_vars_coeffs}},
  {{=it._ind_vars_stand_errs}},
  {{=it._ind_vars_t_vals}},
  gwr.predicted,
  gwr.residuals,
  gwr.r_squared,
  gwr.bandwidth
FROM cdb_crankshaft.CDB_GWR_Predict('{{=it._query}}'::text,
  '{{=it._dep_var}}',
  Array[{{=it._ind_vars}}], {{=it._bandwidth}}, {{=it._fixed}}, '{{=it._kernel}}') As gwr
JOIN ({{=it._query}}) input_query
on input_query.cartodb_id = gwr.rowid
