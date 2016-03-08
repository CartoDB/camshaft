'use strict';

var map = L.map('map', {
    scrollWheelZoom: false,
    center: [-18, -46],
    zoom: 8
});

map.on('zoomend', function(e) {
    console.log('Current zoom = %d', e.target.getZoom());
});

L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
    attribution: '<a href="http://cartodb.com">CartoDB</a> © 2014',
    maxZoom: 18
}).addTo(map);

L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
    attribution: '<a href="http://cartodb.com">CartoDB</a> © 2014',
    maxZoom: 18
}).setZIndex(3).addTo(map);

var analysisEditor = CodeMirror.fromTextArea(document.getElementById('analysis_editor'), {
    theme: 'monokai',
    lineNumbers: true,
    lineWrapping: true,
    mode: 'application/json',
    height: '400px'
});

var cssEditor = CodeMirror.fromTextArea(document.getElementById('css_editor'), {
    theme: 'monokai',
    lineNumbers: true,
    lineWrapping: true,
    mode: "text/x-scss",
    height: "200px"
});

function tilesEndpoint(layergroupId) {
    return currentEndpoint() + '/' + layergroupId + '/{z}/{x}/{y}.png?api_key=' + currentApiKey();
}

var tilesLayer = null;
function updateMap(example) {
    if ( tilesLayer) {
        map.removeLayer(tilesLayer);
    }

    if (example) {
        map.setView(example.center || [30, 0], example.zoom || 3);
    }

    var config = {
        version: '1.5.0',
        layers: [
            {
                type: 'analysis',
                options: {
                    def: analysisEditor.getValue(),
                    cartocss: cssEditor.getValue()
                }
            }
        ]
    };

    var request = new XMLHttpRequest();
    request.open('POST', currentEndpoint() + '?api_key=' + currentApiKey(), true);
    request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    request.onload = function() {
        if (this.status >= 200 && this.status < 400){
            var layergroup = JSON.parse(this.response);

            tilesLayer = L.tileLayer(tilesEndpoint(layergroup.layergroupid), {
                maxZoom: 18
            }).setZIndex(2).addTo(map);

            console.log('Current zoom = %d', map.getZoom());
        } else {
            throw 'Error calling server: Error ' + this.status + ' -> ' + this.response;
        }
    };
    request.send(JSON.stringify(config));
}

function currentExample() {
    return examples[examplesSelector.value];
}

function currentEndpoint() {
    return document.getElementById('endpoint').value;
}

function currentApiKey() {
    return document.getElementById('apikey').value;
}

function loadExample() {
    var example = currentExample();
    analysisEditor.setValue(JSON.stringify(example.def, null, 2) + '\n');
    cssEditor.setValue(example.cartocss + '\n');

    updateMap(example);
}

CodeMirror.commands.save = function() {
    updateMap();
};


var examplesSelector = document.getElementById('examples');
examplesSelector.addEventListener('change', loadExample, false);


Object.keys(examples).forEach(function(k) {
    var option = document.createElement('option');
    option.value = k;
    option.innerText = examples[k].name;

    examplesSelector.appendChild(option);
});

document.getElementById('endpoint').addEventListener('blur', updateMap, false);

if (window.analysisConfig && window.analysisConfig.API_KEY) {
    document.getElementById('apikey').value = window.analysisConfig.API_KEY;
    loadExample();
} else {
    var message = 'You can use a config.js file to setup your API key, check config.sample.js for reference';
    alert(message);
    console.info(message);
}
