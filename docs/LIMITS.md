To check limits, the `checkLimits` method of Node must be overriden.

## Examples

### Simple, predefined check:

Check number of input rows.

```javascript
var LIMITS = {
    maximumNumberOfRows: {
        default: 1e6,
        name: 'maximumNumberOfRows',
        message: 'too many source rows'
    }
};

var LIMITS_DISSOLVED = {
    maximumNumberOfRows: {
        default: 1e5,
        name: 'maximumNumberOfRowsDissolved',
        message: 'too many source rows'
    }
};

Buffer.prototype.checkLimits = function(context, callback) {
    var limits = this.dissolved ? LIMITS_DISSOLVED : LIMITS;

    Checks.check(this, context, [{
        checker: Checks.limitInputRows,
        params: { input: 'source' },
        limits: limits
    }], callback);
};
```

### Multiple, predefined checks:

Check both the number of input and output rows.

```javascript
var INPUT_LIMITS = {
    maximumNumberOfRows: {
        default: 1e6,
        name: 'maximumInputNumberOfRows',
        message: 'too many source rows'
    }
};

var INPUT_LIMITS_DISSOLVED = {
    INPUT_maximumNumberOfRows: {
        default: 1e5,
        name: 'maximumInputNumberOfRowsDissolved',
        message: 'too many source rows'
    }
};

var OUTPUT_LIMITS = {
    maximumNumberOfRows: {
        default: 1e6,
        name: 'maximumInputNumberOfRows',
        message: 'too many source rows'
    }
};

Buffer.prototype.checkLimits = function(context, callback) {
    var inputLimits = this.dissolved ? INPUT_LIMITS_DISSOLVED : INPUT_LIMITS;
    var outputLimits = OUTPUT_LIMITS;

    Checks.check(this, context, [{
        checker: Checks.limitInputRows,
        params: { input: 'source' },
        limits: inputLimits
    }, {
        checker: Checks.limitNumberOfRows,
        limits: outputLimits
    }], callback);
};
```

To avoid needeing a specific `limitInputRows` we coud: 

```javascript
Buffer.prototype.checkLimits = function(context, callback) {
    var inputLimits = this.dissolved ? INPUT_LIMITS_DISSOLVED : INPUT_LIMITS;
    var outputLimits = OUTPUT_LIMITS;

    Checks.check(this, context, [{
        checker: function(node, context, limits, params, callback) {
            Checks.limitNumberOfRows(node.source, context, limits, params, callback);
        },
        limits: inputLimits
    }, {
        checker: Checks.limitNumberOfRows,
        limits: outputLimits
    }], callback);
};
```

### Custome checks

Check the user's luck.

```javascript
var LIMITS = {
    chanceOfSuccess: {
        default: 0.5,
        message: 'no luck this time'
    }
};

Buffer.prototype.checkLimits = function(context, callback) {
    Checks.check(this, context, [{
        checker: function(node, context, limits, params, callback) {
             var err = null;
             if (Math.ramdom() < limits.chanceOfSuccess.value) {
                 err = nodeError(node, [limits.chanceOfSuccess.message]);
             }
             callback(err);
        },
        limits: LIMITS
    }], callback);
};
```
