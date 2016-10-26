'use strict';

var async = require('async');

var debug = require('./util/debug')('analysis');

var Factory = require('./workflow/factory');
var toposort = require('../lib/dag/toposort');
var validator = require('../lib/dag/validator');

var DatabaseService = require('./service/database');

var AnalysisLogger = require('./logging/logger');

function Analysis(rootNode) {
    this.rootNode = rootNode;
}

Analysis.prototype.id = function() {
    return this.rootNode.id();
};

Analysis.prototype.getQuery = function() {
    return this.rootNode.getQuery();
};

Analysis.prototype.getRoot = function() {
    return this.rootNode;
};

Analysis.prototype.getNodes = function() {
    function buildList(node, nodesList) {
        nodesList = nodesList || [node];

        node.getInputNodes().forEach(function(inputNode) {
            nodesList.push(inputNode);

            buildList(inputNode, nodesList);
        });

        return nodesList;
    }

    return buildList(this.rootNode);
};

Analysis.prototype.getSortedNodes = function() {
    return toposort(this.rootNode);
};

function AnalysisFactory(DatabaseServiceClass) {
    this.DatabaseServiceClass = DatabaseServiceClass;
}

AnalysisFactory.prototype.create = function(configuration, definition, callback) {
    debug(configuration.user, configuration.db, configuration.batch);
    var databaseService = new this.DatabaseServiceClass(
        configuration.user,
        configuration.db,
        configuration.batch,
        configuration.limits
    );
    var logger = configuration.logger ? new AnalysisLogger(configuration.logger.stream, configuration.user) : undefined;

    async.waterfall(
        [
            function analysis$createWithFactory(done) {
                var factory = new Factory(configuration.user, databaseService);
                factory.create(JSON.parse(JSON.stringify(definition)), done);
            },
            function analysis$validate(rootNode, done) {
                if (!validator.isValid(rootNode)) {
                    return done(new Error('Invalid analysis, cycle found'));
                }

                return done(null, new Analysis(rootNode));
            },
            function analysis$register(analysis, done) {
                databaseService.registerAnalysisInCatalog(analysis, function(err) {
                    return done(err, analysis);
                });
            },
            function analysis$requirements(analysis, done) {
                // TODO: check analysis.rootNode.validateRequirements()
                var messages = analysis.rootNode.requirementMessages();
                if (messages.length > 0) {
                    return done(new Error(messages.join("\n")));
                }
                return done(null, analysis);
            },
            function analysis$queueOperations(analysis, done) {
                databaseService.queueAnalysisOperations(analysis, function(err) {
                    return done(err, analysis);
                });
            },
            function analysis$track(analysis, done) {
                if (logger) {
                    logger.log(analysis);
                }

                databaseService.trackAnalysis(analysis, function(err) {
                    return done(err, analysis);
                });
            }
        ],
        function analysis$finish(err, analysis) {
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
