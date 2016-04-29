'use strict';

module.exports = function buildRange(finalValue, stepsNumber) {
    var range = [];
    var stepSize = Math.ceil(finalValue / stepsNumber);
    var currentValue;

    for (var currentStep = 1; currentStep <= stepsNumber; currentStep++) {
        currentValue = currentStep * stepSize;

        if (currentValue > finalValue) {
            range.push(finalValue);
        } else {
            range.push(currentValue);
        }
    }

    return range;
};
