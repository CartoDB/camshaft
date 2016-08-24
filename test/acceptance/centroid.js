'use strict';

var assert = require('assert');

var Analysis = require('../../lib/analysis');

var testConfig = require('../test-config');
var QueryRunner = require('../../lib/postgresql/query-runner');

describe('centroid analysis', function() {

    var queryRunner;

    before(function() {
        queryRunner = new QueryRunner(testConfig.db);
    });

    var QUERY = 'select * from atm_machines';
    var CATEGORY_COLUMN = 'kind';
    var AGGREGATION = 'avg';
    var AGGREGATION_COLUMN = 'cartodb_id';

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
        var centroidDefinition = {
            type: 'centroid',
            params: {
                source: sourceAtmMachines,
            }
        };

        it('should create an analysis', function (done) {
            performAnalysis(centroidDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }
                assert.ok(values);
                done();
            });
        });
    });

    describe('with category column', function () {
        var centroidDefinition = {
            type: 'centroid',
            params: {
                source: sourceAtmMachines,
                category_column: CATEGORY_COLUMN
            }
        };

        it('should create an analysis', function (done) {
            performAnalysis(centroidDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }
                assert.ok(values);
                done();
            });
        });
    });

    describe('with category column and aggregation (miss aggregation_column)', function () {
        var centroidDefinition = {
            type: 'centroid',
            params: {
                source: sourceAtmMachines,
                category_column: CATEGORY_COLUMN,
                aggregation: AGGREGATION
            }
        };

        it('should return error', function (done) {
            performAnalysis(centroidDefinition, function (err, values) {
                assert.ok(err);
                assert.ok(!values);
                done();
            });
        });
    });

    describe('with category column, aggregation and aggregation column', function () {
        var centroidDefinition = {
            type: 'centroid',
            params: {
                source: sourceAtmMachines,
                category_column: CATEGORY_COLUMN,
                aggregation: AGGREGATION,
                aggregation_column: AGGREGATION_COLUMN
            }
        };

        it('should create an analysis', function (done) {
            performAnalysis(centroidDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }
                assert.ok(values);
                done();
            });
        });
    });


    describe('with aggregation (miss aggregation_colum for avg method)', function () {
        var centroidDefinition = {
            type: 'centroid',
            params: {
                source: sourceAtmMachines,
                aggregation: AGGREGATION
            }
        };

        it('should return error', function (done) {
            performAnalysis(centroidDefinition, function (err, values) {
                assert.ok(err);
                assert.ok(!values);
                done();
            });
        });
    });


    describe('with aggregation (miss aggregation_colum for avg method)', function () {
        var centroidDefinition = {
            type: 'centroid',
            params: {
                source: sourceAtmMachines,
                aggregation: 'count'
            }
        };

        it('should create an analysis', function (done) {
            performAnalysis(centroidDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }
                assert.ok(values);
                done();
            });
        });
    });

    describe('with aggregation and aggregation column', function () {
        var centroidDefinition = {
            type: 'centroid',
            params: {
                source: sourceAtmMachines,
                aggregation: AGGREGATION,
                aggregation_column: AGGREGATION_COLUMN
            }
        };

        it('should create an analysis', function (done) {
            performAnalysis(centroidDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }
                assert.ok(values);
                done();
            });
        });
    });


    describe('with category_column and aggregation column', function () {
        var centroidDefinition = {
            type: 'centroid',
            params: {
                source: sourceAtmMachines,
                category_column: CATEGORY_COLUMN,
                aggregation_column: AGGREGATION_COLUMN
            }
        };

        it('should return error', function (done) {
            performAnalysis(centroidDefinition, function (err, values) {
                assert.ok(err);
                assert.ok(!values);
                done();
            });
        });
    });
});
