'use strict';

var Node = require('../node');

var gwrDescribeTemplate = Node.getSqlTemplateFn('gwr');

var TYPE = 'gwr-describe';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    dep_var: Node.PARAM.STRING(),
    ind_vars: Node.PARAM.ARRAY(),
    bandwidth: Node.PARAM.NULLABLE(Node.PARAM.NUMBER(), null),
    fixed: Node.PARAM.NULLABLE(Node.PARAM.BOOLEAN(), false),
    kernel: Node.PARAM.NULLABLE(Node.PARAM.STRING(), 'bisquare'),
    geom_col: Node.PARAM.NULLABLE(Node.PARAM.STRING(), 'the_geom'),
    id_col: Node.PARAM.NULLABLE(Node.PARAM.STRING(), 'cartodb_id')
};

var GWRDescribe = Node.create(TYPE, PARAMS, { cache: true, version: 1 });

module.exports = GWRDescribe;

GWRDescribe.prototype.sql = function() {
    return gwrDescribeTemplate({
        _query: this.source.getQuery(),
        _dep_var: this.dep_var,
        _ind_vars: this.ind_vars.map(function (c) {
          return '\'' + c + '\'';
        }).join(', '),
        _ind_vars_coeffs: this.ind_vars.map(function (c) {
          return '(gwr.coeffs->>\'' + c + '\')::numeric as coeff_' + c;
        }).join(', '),
        _ind_vars_stand_errs: this.ind_vars.map(function (c) {
          return '(gwr.stand_errs->>\'' + c + '\')::numeric as stand_err_' + c;
        }).join(', '),
        _ind_vars_t_vals: this.ind_vars.map(function (c) {
          return '(gwr.t_vals->>\'' + c + '\')::numeric as t_val_' + c;
        }).join(', '),
        _bandwidth: this.bandwidth,
        _fixed: this.fixed,
        _kernel: this.kernel,
        _geom_col: this.geom_col,
        _id_col: this.id_col
    });
};
