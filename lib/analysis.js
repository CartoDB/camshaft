'use strict';

var async = require('async');

var debug = require('./util/debug')('analysis');

var Factory = require('./workflow/factory');
var toposort = require('../lib/dag/toposort');

function validator (rootNode) {
    toposort(rootNode);
}

var DatabaseService = require('./service/database');

var LimitsContext = require('./limits/context');
var limitsChecker = require('./limits/checker');

var AnalysisLogger = require('./logging/logger');

function Analysis (rootNode) {
    this.rootNode = rootNode;
}

Analysis.prototype.id = function () {
    return this.rootNode.id();
};

Analysis.prototype.getQuery = function () {
    return this.rootNode.getQuery();
};

Analysis.prototype.getRoot = function () {
    return this.rootNode;
};

Analysis.prototype.getNodes = function () {
    function buildList (node, nodesList) {
        nodesList = nodesList || [node];

        node.getInputNodes().forEach(function (inputNode) {
            nodesList.push(inputNode);

            buildList(inputNode, nodesList);
        });

        return nodesList;
    }

    return buildList(this.rootNode);
};

Analysis.prototype.getSortedNodes = function () {
    return toposort(this.rootNode);
};

function AnalysisFactory (DatabaseServiceClass) {
    this.DatabaseServiceClass = DatabaseServiceClass;
}

AnalysisFactory.prototype.create = function (configuration, definition, callback) {
    debug(configuration.user, configuration.db, configuration.batch);
    var databaseService = new this.DatabaseServiceClass(
        configuration.user,
        configuration.db,
        configuration.batch,
        configuration.limits
    );

    var logger = new AnalysisLogger(configuration.logger);
    var limitsContext = new LimitsContext(databaseService, configuration.limits, logger);

    async.waterfall(
        [
            function analysis$createWithFactory (done) {
                var factory = new Factory(configuration.user, databaseService);
                factory.create(JSON.parse(JSON.stringify(definition)), done);
            },
            function analysis$validate (rootNode, done) {
                try {
                    validator(rootNode);
                } catch (err) {
                    debug(err);
                    err.message = 'Invalid analysis, cycle found';
                    return done(err);
                }

                return done(null, new Analysis(rootNode));
            },
            function analysis$checkLimits (analysis, done) {
                limitsChecker(analysis, limitsContext, function (err) {
                    return done(err, analysis);
                });
            },
            function analysis$register (analysis, done) {
                databaseService.registerAnalysisInCatalog(analysis, function (err) {
                    return done(err, analysis);
                });
            },
            function analysis$queueOperations (analysis, done) {
                databaseService.queueAnalysisOperations(analysis, function (err) {
                    return done(err, analysis);
                });
            },
            function analysis$track (analysis, done) {
                logger.info({ analysis }, 'Analysis created');

                databaseService.trackAnalysis(analysis, function (err) {
                    return done(err, analysis);
                });
            }
        ],
        function analysis$finish (err, analysis) {
            if (err) {
                if (err && err.message && err.message.match(/permission denied/i)) {
                    err = new Error('Analysis requires authentication with API key: permission denied.');
                }
                return callback(err);
            }
            return callback(null, analysis);
        }
    );
};

module.exports = AnalysisFactory;
var analysisFactory = new AnalysisFactory(DatabaseService);
module.exports.create = analysisFactory.create.bind(analysisFactory);
module.exports.reference = require('../reference');
module.exports.version = require('../package.json').version;
