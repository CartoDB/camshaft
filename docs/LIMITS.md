To check limits, the `checkLimits` method of Node must be overriden.

## Examples

### Simple, predefined check:

Check number of input rows.

```javascript
var LIMITS = new Limits({
    maximumNumberOfRows: {
        default: 1e6,
        name: 'maximumNumberOfRows',
        message: 'too many source rows'
    }
});

var LIMITS_DISSOLVED = new Limits({
    maximumNumberOfRows: {
        default: 1e5,
        name: 'maximumNumberOfRowsDissolved',
        message: 'too many source rows'
    }
});

Buffer.prototype.checkLimits = function(context, callback) {
    var inputLimits = this.dissolved ? LIMITS_DISSOLVED : LIMITS;
    inputLimits.isWithinRowsLimit(this.source, done);
};
```

### Multiple, predefined checks:

Check both the number of input and output rows.

```javascript
var LIMITS = new Limits({
    maximumNumberOfRows: {
        default: 1e6,
        name: 'maximumNumberOfRows',
        message: 'too many source rows'
    }
});

var LIMITS_DISSOLVED = new Limits({
    maximumNumberOfRows: {
        default: 1e5,
        name: 'maximumNumberOfRowsDissolved',
        message: 'too many source rows'
    }
});

var OUTPUT_LIMITS = new Limits({
    maximumNumberOfRows: {
        default: 1e6,
        name: 'maximumInputNumberOfRows',
        message: 'too many source rows'
    }
});

Buffer.prototype.checkLimits = function(context, callback) {
    var inputLimits = this.dissolved ? LIMITS_DISSOLVED : LIMITS;
    var outputLimits = OUTPUT_LIMITS;

    async.waterfall([
        function(done) {
            inputLimits.isWithinRowsLimit(this.source, done);
        },
        function(done) {
            outputLimits.isWithinRowsLimit(this, done);
        }
    ], callback);

};
```

### Custome checks

Check the user's luck.

```javascript
var LIMITS = new Limits({
    chanceOfSuccess: {
        default: 0.5,
        message: 'no luck this time'
    }
});

Buffer.prototype.checkLimits = function(context, callback) {
    var err = null;
    if (Math.ramdom() < LIMITS.value('chanceOfSuccess')) {
        err = nodeError(node, [LIMITS.message('chanceOfSuccess')]);
    }
    callback(err);
};
```
