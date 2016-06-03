var SOURCE_QUERY = 'select ST_BUFFER(CDB_LatLng(0,0)::geography, 2000)::geometry as the_geom ';
var NO_POINTS = 10;

var sourceAtmDef = {
    type: 'source',
    params: {
        query: SOURCE_QUERY
    }
};


var dotDensityDefinition = {
    type: 'dot_density',
    params: {
        source: SOURCE_QUERY, 
	points: 10
    }
};


module.exports = dotDensityDefinition ;
