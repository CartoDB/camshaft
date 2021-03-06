'use strict';

var assert = require('assert');
var Source = require('../../../lib/node/nodes/source');
var DataObservatoryMultipleMeasures = require('../../../lib/node/nodes/data-observatory-multiple-measures');

describe('data-observatory-multiple-measure', function () {
    var owner = 'localhost';
    var numerators = ['es.ine.t2_2', 'es.ine.t2_1'];
    var normalizations = ['denominated', 'denominated'];
    var denominators = ['es.ine.t1_1', 'es.ine.t1_1'];
    var geomIds = ['es.ine.the_geom', 'es.ine.the_geom'];
    var numeratorTimespans = ['2011', '2011'];
    var columnNames = ['females', 'males'];

    var source = new Source(owner, { query: 'select * from table' });

    it('should not pass null values as string params for DO', function () {
        var doMeasure = new DataObservatoryMultipleMeasures(owner, {
            source: source,
            numerators: numerators,
            normalizations: normalizations,
            denominators: [null, null],
            geom_ids: [null, null],
            numerator_timespans: [null, null],
            column_names: columnNames
        });

        assert.equal(doMeasure.sql().indexOf('"null"'), -1);
    });

    it('should use "es.ine.t1_1" as denomitator params for DO', function () {
        var doMeasure = new DataObservatoryMultipleMeasures(owner, {
            source: source,
            numerators: numerators,
            normalizations: normalizations,
            denominators: denominators,
            geom_ids: geomIds,
            numerator_timespans: numeratorTimespans,
            column_names: columnNames
        });

        assert.equal(doMeasure.sql().indexOf('"null"'), -1);
        assert.notEqual(doMeasure.sql().indexOf('"' + denominators[0] + '"'), -1);
        assert.notEqual(doMeasure.sql().indexOf('"' + denominators[1] + '"'), -1);
    });

    it('should use "es.ine.the_geom" as geom_id params for DO', function () {
        var doMeasure = new DataObservatoryMultipleMeasures(owner, {
            source: source,
            numerators: numerators,
            normalizations: normalizations,
            denominators: denominators,
            geom_ids: geomIds,
            numerator_timespans: numeratorTimespans,
            column_names: columnNames
        });

        assert.equal(doMeasure.sql().indexOf('"null"'), -1);
        assert.notEqual(doMeasure.sql().indexOf('"' + geomIds[0] + '"'), -1);
        assert.notEqual(doMeasure.sql().indexOf('"' + geomIds[1] + '"'), -1);
    });

    it('should use "2011" as numerator_timespan params for DO', function () {
        var doMeasure = new DataObservatoryMultipleMeasures(owner, {
            source: source,
            numerators: numerators,
            normalizations: normalizations,
            denominators: denominators,
            geom_ids: geomIds,
            numerator_timespans: numeratorTimespans,
            column_names: columnNames
        });

        assert.equal(doMeasure.sql().indexOf('"null"'), -1);
        assert.notEqual(doMeasure.sql().indexOf('"' + numeratorTimespans[0] + '"'), -1);
        assert.notEqual(doMeasure.sql().indexOf('"' + numeratorTimespans[1] + '"'), -1);
    });
});
