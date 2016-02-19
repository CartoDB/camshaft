'use strict';

var async = require('async');

var debug = require('./util/debug')('analysis');

var Factory = require('./workflow/factory');
var toposort = require('../lib/dag/toposort');
var validator = require('../lib/dag/validator');

var DatabaseService = require('./service/database');

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

Analysis.prototype.getSortedNodes = function() {
    return toposort(this.rootNode);
};


function create(configuration, definition, callback) {
    debug('Using configuration=%j', configuration);
    var databaseService = new DatabaseService(configuration.db, configuration.batch);
    async.waterfall(
        [
            function analysis$createWithFactory(done) {
                var factory = new Factory(databaseService);
                factory.create(definition, done);
            },
            function analysis$validate(rootNode, done) {
                if (!validator.isValid(rootNode)) {
                    return done(new Error('Invalid analysis, cycle found'));
                }

                return done(null, new Analysis(rootNode));
            },
            function analysis$registerNodes(analysis, done) {
                databaseService.registerNodesInCatalog(analysis.getSortedNodes(), function(err) {
                    return done(err, analysis);
                });
            },
            function analysis$trackAnalysis(analysis, done) {
                databaseService.trackNode(analysis.getRoot(), function(err) {
                    return done(err, analysis);
                });
            }
        ],
        function analysis$finish(err, analysis) {
            if (err) {
                return callback(err);
            }

            return callback(null, analysis);
        }
    );
}

module.exports.create = create;
