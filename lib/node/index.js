'use strict';

var fs = require('fs');

var modelsDirectory = __dirname + '/nodes';
var nodes = fs.readdirSync(modelsDirectory)
    .map(function(modelFile) {
        return modelsDirectory + '/' + modelFile;
    })
    .filter(function(modelFilePath) {
        return fs.statSync(modelFilePath).isFile();
    })
    .map(function(modelFilePath) {
        return require(modelFilePath);
    });

module.exports = nodes;
