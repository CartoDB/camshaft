'use strict';

var assert = require('assert');

var async = require('async');

var TestConfig = require('./test-config');
var testConfig = TestConfig.create({ batch: { inlineExecution: true } });

var Analysis = require('../lib/analysis');
var QueryRunner = require('../lib/postgresql/query-runner');

function createAnalysis(testConfig, definition, callback) {
    Analysis.create(testConfig, definition, callback);
}

function createAnalyses(analyses, config, callback) {
    if (!callback) {
        callback = config;
        config = testConfig;
    }

    analyses = Array.isArray(analyses) ? analyses : [analyses];

    var _createAnalysis = createAnalysis.bind(null, config);

    async.map(analyses, _createAnalysis, function(err) {
        if (err) {
            return callback(err);
        }
        async.map(analyses, _createAnalysis, function(err, results) {
            if (err) {
                return callback(err);
            }

            return callback(null, results.length === 1 ? results[0] : results);
        });
    });
}

module.exports.createAnalyses = createAnalyses;

function getRows(query, config, callback) {
    if (!callback) {
        callback = config;
        config = testConfig;
    }

    var queryRunner = new QueryRunner(config.db);

    queryRunner.run(query, function(err, result) {
        assert.ok(!err, err);
        assert.ok(result);
        var rows = result.rows;
        assert.ok(Array.isArray(rows));

        return callback(null, rows);
    });
}

module.exports.getRows = getRows;

function getResult(analysisDefinition, config, callback) {
    if (!callback) {
        callback = config;
        config = testConfig;
    }
    createAnalyses(analysisDefinition, config, function(err, analysisResult) {
        if (err) {
            return callback(err);
        }
        getRows(analysisResult.getRoot().getQuery(), config, callback);
    });
}

module.exports.getResult = getResult;
