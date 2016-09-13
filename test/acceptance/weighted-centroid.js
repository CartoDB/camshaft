'use strict';

var assert = require('assert');

var Analysis = require('../../lib/analysis');

var testConfig = require('../test-config');
var QueryRunner = require('../../lib/postgresql/query-runner');

describe('weighted centroid analysis', function() {

    var queryRunner;

    before(function() {
        queryRunner = new QueryRunner(testConfig.db);
    });

    var QUERY = 'select * from atm_machines';
    var CATEGORY_COLUMN = 'bank';
    var AGGREGATION = 'avg';
    var AGGREGATION_COLUMN = 'cartodb_id';
    var WEIGHT_COLUMN = 'kind';

    var sourceAtmMachines = {
        type: 'source',
        params: {
            query: QUERY
        }
    };

    var config = testConfig.create({
        batch: {
            inlineExecution: true
        }
    });

    function performAnalysis(definition, callback) {
        Analysis.create(config, definition, function (err, analysis) {
            if (err) {
                return callback(err);
            }

            queryRunner.run(analysis.getQuery(), function(err, result) {
                if (err) {
                    return callback(err);
                }

                assert.ok(Array.isArray(result.rows));
                var values = result.rows.map(function (value) {
                    return value;
                });

                callback(null, values);
            });
        });
    }

    describe('non optional params', function () {
        var weightedCentroidDefinition = {
            type: 'weighted-centroid',
            params: {
                source: sourceAtmMachines,
                weight_column: WEIGHT_COLUMN
            }
        };

        it('should create an analysis', function (done) {
            performAnalysis(weightedCentroidDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }
                assert.ok(values);
                done();
            });
        });
    });

    describe('with category column', function () {
        var weightedCentroidDefinition = {
            type: 'weighted-centroid',
            params: {
                source: sourceAtmMachines,
                weight_column: WEIGHT_COLUMN,
                category_column: CATEGORY_COLUMN
            }
        };

        it('should create an analysis', function (done) {
            performAnalysis(weightedCentroidDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }
                assert.ok(values);
                done();
            });
        });
    });

    describe('with category column and aggregation (miss aggregation_column)', function () {
        var weightedCentroidDefinition = {
            type: 'weighted-centroid',
            params: {
                source: sourceAtmMachines,
                weight_column: WEIGHT_COLUMN,
                category_column: CATEGORY_COLUMN,
                aggregation: AGGREGATION
            }
        };

        it('should create an analysis', function (done) {
            performAnalysis(weightedCentroidDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }
                assert.ok(values);
                done();
            });
        });
    });

    describe('with category column, aggregation and aggregation column', function () {
        var weightedCentroidDefinition = {
            type: 'weighted-centroid',
            params: {
                source: sourceAtmMachines,
                weight_column: WEIGHT_COLUMN,
                category_column: CATEGORY_COLUMN,
                aggregation: AGGREGATION,
                aggregation_column: AGGREGATION_COLUMN
            }
        };

        it('should create an analysis', function (done) {
            performAnalysis(weightedCentroidDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }
                assert.ok(values);
                done();
            });
        });
    });


    describe('with aggregation (miss aggregation_colum for avg method)', function () {
        var weightedCentroidDefinition = {
            type: 'weighted-centroid',
            params: {
                source: sourceAtmMachines,
                aggregation: AGGREGATION,
                weight_column: WEIGHT_COLUMN
            }
        };

        it('should return error', function (done) {
            performAnalysis(weightedCentroidDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }
                assert.ok(values);
                done();
            });
        });
    });


    describe('with aggregation (miss aggregation_colum for avg method)', function () {
        var weightedCentroidDefinition = {
            type: 'weighted-centroid',
            params: {
                source: sourceAtmMachines,
                weight_column: WEIGHT_COLUMN,
                aggregation: 'count'
            }
        };

        it('should create an analysis', function (done) {
            performAnalysis(weightedCentroidDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }
                assert.ok(values);
                done();
            });
        });
    });

    describe('with aggregation and aggregation column', function () {
        var weightedCentroidDefinition = {
            type: 'weighted-centroid',
            params: {
                source: sourceAtmMachines,
                weight_column: WEIGHT_COLUMN,
                aggregation: AGGREGATION,
                aggregation_column: AGGREGATION_COLUMN
            }
        };

        it('should create an analysis', function (done) {
            performAnalysis(weightedCentroidDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }
                assert.ok(values);
                done();
            });
        });
    });


    describe('with category_column and aggregation column', function () {
        var weightedCentroidDefinition = {
            type: 'weighted-centroid',
            params: {
                source: sourceAtmMachines,
                weight_column: WEIGHT_COLUMN,
                category_column: CATEGORY_COLUMN,
                aggregation_column: AGGREGATION_COLUMN
            }
        };

        it('should return error', function (done) {
            performAnalysis(weightedCentroidDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }
                assert.ok(values);
                done();
            });
        });
    });
});
