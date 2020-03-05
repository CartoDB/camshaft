'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe('routing-sequencial analysis', function () {
    function routingSequentialDefinition (params) {
        return {
            type: 'routing-sequential',
            params: {
                source: {
                    type: 'source',
                    params: {
                        query: 'select * from atm_machines'
                    }
                },
                mode: params.mode,
                units: params.units || 'kilometers',
                order_column: params.order_column || 'cartodb_id',
                order_type: params.order_type || 'asc'
            }
        };
    }

    it('should fail for a mode not allowed', function (done) {
        var def = routingSequentialDefinition({
            mode: 'unknown'
        });

        testHelper.getResult(def, function (err) {
            assert.ok(err);
            assert.equal(err.message, 'Invalid type for param "mode", expects ' +
                                      '"enum("car","walk","bicycle","public_transport")" type, got `"unknown"`');
            return done();
        });
    });

    it('should fail for a units type not allowed', function (done) {
        var def = routingSequentialDefinition({
            mode: 'car',
            units: 'unknown'
        });

        testHelper.getResult(def, function (err) {
            assert.ok(err);
            assert.equal(err.message, 'Invalid type for param "units", expects ' +
                                      '"enum("kilometers","miles")" type, got `"unknown"`');
            return done();
        });
    });

    it('should fail for a order type not allowed', function (done) {
        var def = routingSequentialDefinition({
            mode: 'car',
            order_type: 'unknown'
        });

        testHelper.getResult(def, function (err) {
            assert.ok(err);
            assert.equal(err.message, 'Invalid type for param "order_type", ' +
                                      'expects "enum("asc","desc")" type, got `"unknown"`');
            return done();
        });
    });

    it('should return results with the default parameters', function (done) {
        var def = routingSequentialDefinition({
            mode: 'car'
        });

        testHelper.getResult(def, function (err, result) {
            assert.ifError(err);
            assert.ok(result);
            return done();
        });
    });

    it('should return results with the default parameters', function (done) {
        var def = routingSequentialDefinition({
            mode: 'car'
        });

        testHelper.getResult(def, function (err, result) {
            assert.ifError(err);
            assert.ok(result);
            assert.ok(Number.isFinite(result[0].duration));
            assert.ok(Number.isFinite(result[0].length));
            assert.ok(result[0].the_geom);
            return done();
        });
    });

    it('should return results with the provided parameters', function (done) {
        var def = routingSequentialDefinition({
            mode: 'car',
            units: 'miles',
            order_columnn: 'cartodb_id',
            order_type: 'desc'
        });

        testHelper.getResult(def, function (err, result) {
            assert.ifError(err);
            assert.ok(result);
            assert.ok(Number.isFinite(result[0].duration));
            assert.ok(Number.isFinite(result[0].length));
            assert.ok(result[0].the_geom);
            return done();
        });
    });
});
