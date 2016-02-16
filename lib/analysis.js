'use strict';

var async = require('async');

var debug = require('./util/debug')('analysis');

var Factory = require('./workflow/factory');
var toposort = require('../lib/dag/toposort');
var validator = require('../lib/dag/validator');

var DatabaseService = require('./service/database');
var UserConfigurationService = require('./service/user-configuration');
var userConfigurationService = new UserConfigurationService();

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


function create(username, definition, callback) {
    async.waterfall(
        [
            function analysis$getDbParams(done) {
                userConfigurationService.getConfiguration(username, done);
            },
            function analysis$createFactory(userConfiguration, done) {
                debug('Using userConfiguration=%j', userConfiguration);
                var databaseService = new DatabaseService(username, userConfiguration.api.apiKey, userConfiguration.db);
                var factory = new Factory(databaseService);
                factory.create(definition, done);
            }
        ],
        function analysis$finish(err, rootNode) {
            if (err) {
                return callback(err);
            }

            if (!validator.isValid(rootNode)) {
                return callback(new Error('Invalid analysis, cycle found'));
            }

            return callback(null, new Analysis(rootNode));
        }
    );
}

module.exports.create = create;
