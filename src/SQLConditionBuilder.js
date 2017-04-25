var SQLConditionBuilder, squel,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

squel = require('squel');

SQLConditionBuilder = (function(superClass) {
  extend(SQLConditionBuilder, superClass);

  function SQLConditionBuilder() {
    SQLConditionBuilder.__super__.constructor.apply(this, arguments);
    this.valueFormatters = [];
    this.registerValueFormatter(null, (function(_this) {
      return function(value) {
        return 'IS NULL';
      };
    })(this));
    this.registerValueFormatter('null', (function(_this) {
      return function(value) {
        return 'IS NULL';
      };
    })(this));
    this.registerValueFormatter('!null', (function(_this) {
      return function(value) {
        return 'IS NOT NULL';
      };
    })(this));
    this.registerValueFormatter('>=', (function(_this) {
      return function(value) {
        return ">= " + _this._escapeValue(value.substring(2));
      };
    })(this));
    this.registerValueFormatter('>', (function(_this) {
      return function(value) {
        return "> " + _this._escapeValue(value.substring(1));
      };
    })(this));
    this.registerValueFormatter('<=', (function(_this) {
      return function(value) {
        return "<= " + _this._escapeValue(value.substring(2));
      };
    })(this));
    this.registerValueFormatter('<', (function(_this) {
      return function(value) {
        return "< " + _this._escapeValue(value.substring(1));
      };
    })(this));
    this.registerValueFormatter('!', (function(_this) {
      return function(value) {
        return "<> " + _this._escapeValue(value.substring(1));
      };
    })(this));
    this.registerValueFormatter(/[\*\?]+/, (function(_this) {
      return function(value) {
        return "LIKE " + _this._escapeValue(value.replace(/\*/g, '%').replace(/\?/, '_'));
      };
    })(this));
    this.registerValueFormatter(/\[.+ TO .+\]/, (function(_this) {
      return function(value) {
        var splitted;
        splitted = value.substring(1, value.length - 1).split(' TO ');
        return "BETWEEN " + _this._escapeValue(splitted[0]) + " AND " + _this._escapeValue(splitted[1]);
      };
    })(this));
    this.registerValueFormatter(/\[(.+,)*.+\]/, (function(_this) {
      return function(value) {
        var values;
        values = value.substring(1, value.length - 1).split(',');
        return "IN (" + values.map(function(item) {
          return _this._escapeValue(item.replace(/^["]+|["]+$/g, ""));
        }) + ')';
      };
    })(this));
  }

  SQLConditionBuilder.prototype.build = function(object) {
    var expr;
    expr = this.getExpression(object);
    return expr.toString();
  };

  SQLConditionBuilder.prototype.getExpression = function(objectOrArray) {
    var expr;
    expr = squel.expr();
    if (Array.isArray(objectOrArray)) {
      this._buildExpressionWithArray(expr, objectOrArray);
    } else {
      this._buildExpressionWithObject(expr, objectOrArray);
    }
    return expr;
  };

  SQLConditionBuilder.prototype._buildExpressionWithArray = function(expr, array) {
    var i, len, results, value;
    results = [];
    for (i = 0, len = array.length; i < len; i++) {
      value = array[i];
      if (value instanceof Object) {
        expr.or_begin();
        expr.or(this.build(value));
        results.push(expr.end());
      } else {
        results.push(expr.or(value));
      }
    }
    return results;
  };

  SQLConditionBuilder.prototype._buildExpressionWithObject = function(expr, object) {
    var key, parsedValue, results, value;
    results = [];
    for (key in object) {
      value = object[key];
      if (value instanceof Object) {
        results.push(expr.and('(' + this.build(value) + ')'));
      } else {
        parsedValue = this._parseValue(value);
        if (parsedValue) {
          results.push(expr.and(key + ' ' + parsedValue));
        } else {
          results.push(expr.and(key + ' = ' + this._escapeValue(value)));
        }
      }
    }
    return results;
  };

  SQLConditionBuilder.prototype._parseValue = function(value) {
    var f, i, len, ref;
    ref = this.valueFormatters;
    for (i = 0, len = ref.length; i < len; i++) {
      f = ref[i];
      if (f.format instanceof RegExp && f.format.test(value)) {
        return f.fn(value);
      } else if (value === f.format || (value && (typeof value.indexOf === "function" ? value.indexOf(f.format) : void 0) === 0)) {
        return f.fn(value);
      }
    }
    return null;
  };

  SQLConditionBuilder.prototype.registerValueFormatter = function(formatOrPrefix, formatterFunction) {
    return this.valueFormatters.push({
      format: formatOrPrefix,
      fn: formatterFunction
    });
  };

  SQLConditionBuilder.prototype._escapeValue = function(value) {
    if (typeof value !== 'string') {
      return value;
    }
    return this._wrapStringValue(value.replace(/\'/g, '\\\''));
  };

  SQLConditionBuilder.prototype._wrapStringValue = function(value) {
    if (value[0] === '`') {
      return value;
    }
    return "'" + value + "'";
  };

  return SQLConditionBuilder;

})(Object);

module.exports = SQLConditionBuilder;
