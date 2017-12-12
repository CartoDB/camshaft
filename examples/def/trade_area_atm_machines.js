var QUERY_ATM_MACHINES = 'select * from atm_machines';
var TRADE_AREA_WALK = 'walk';
var TRADE_AREA_TIME = 900;
var ISOLINES = 4;

var sourceAtmDef = {
    type: 'source',
    params: {
        query: QUERY_ATM_MACHINES
    }
};

var tradeAreaDefinition = {
    type: 'trade-area',
    params: {
        source: sourceAtmDef,
        kind: TRADE_AREA_WALK,
        time: TRADE_AREA_TIME,
        isolines: ISOLINES,
        dissolved: false
    }
};

module.exports = tradeAreaDefinition;
