(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', 'squel'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('squel'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.squel);
    global.sqlConditionBuilder = mod.exports;
  }
})(this, function (module, exports, _squel) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _squel2 = _interopRequireDefault(_squel);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var SQLConditionBuilder = function () {
    function SQLConditionBuilder() {
      var _this = this;

      _classCallCheck(this, SQLConditionBuilder);

      this.valueFormatters = [];

      this.registerValueFormatter(null, function (value) {
        return 'IS NULL';
      });
      this.registerValueFormatter('null', function (value) {
        return 'IS NULL';
      });
      this.registerValueFormatter('!null', function (value) {
        return 'IS NOT NULL';
      });
      this.registerValueFormatter('>=', function (value) {
        return '>= ' + _this._escapeValue(value.substring(2));
      });
      this.registerValueFormatter('>', function (value) {
        return '> ' + _this._escapeValue(value.substring(1));
      });
      this.registerValueFormatter('<=', function (value) {
        return '<= ' + _this._escapeValue(value.substring(2));
      });
      this.registerValueFormatter('<', function (value) {
        return '< ' + _this._escapeValue(value.substring(1));
      });
      this.registerValueFormatter('!', function (value) {
        return '<> ' + _this._escapeValue(value.substring(1));
      });
      this.registerValueFormatter(/[\*\?]+/, function (value) {
        return 'LIKE ' + _this._escapeValue(value.replace(/\*/g, '%').replace(/\?/, '_'));
      });
      this.registerValueFormatter(/\[.+ TO .+\]/, function (value) {
        var splitted = value.substring(1, value.length - 1).split(' TO ');
        return 'BETWEEN ' + _this._escapeValue(splitted[0]) + ' AND ' + _this._escapeValue(splitted[1]);
      });
      this.registerValueFormatter(/\[(.+,)*.+\]/, function (value) {
        var values = value.substring(1, value.length - 1).split(',');
        return 'IN (' + values.map(function (item) {
          return _this._escapeValue(item.replace(/^["]+|["]+$/g, ""));
        }) + ')';
      });
    }

    _createClass(SQLConditionBuilder, [{
      key: 'build',
      value: function build(object) {
        var expr = this.getExpression(object);
        return expr.toString();
      }
    }, {
      key: 'getExpression',
      value: function getExpression(objectOrArray) {
        var expr = _squel2.default.expr();
        if (Array.isArray(objectOrArray)) {
          this._buildExpressionWithArray(expr, objectOrArray);
        } else {
          this._buildExpressionWithObject(expr, objectOrArray);
        }

        return expr;
      }
    }, {
      key: '_buildExpressionWithArray',
      value: function _buildExpressionWithArray(expr, array) {
        var _this2 = this;

        return Array.from(array).map(function (value) {
          return value instanceof Object ? expr.or(_this2.build(value)) : expr.or(value);
        });
      }
    }, {
      key: '_buildExpressionWithObject',
      value: function _buildExpressionWithObject(expr, object) {
        var _this3 = this;

        return function () {
          var result = [];
          for (var key in object) {
            var value = object[key];
            if (value instanceof Object) {
              result.push(expr.and('(' + _this3.build(value) + ')'));
            } else {
              var parsedValue = _this3._parseValue(value);
              if (parsedValue) {
                result.push(expr.and(key + ' ' + parsedValue));
              } else {
                result.push(expr.and(key + ' = ' + _this3._escapeValue(value)));
              }
            }
          }
          return result;
        }();
      }
    }, {
      key: '_parseValue',
      value: function _parseValue(value) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = Array.from(this.valueFormatters)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var f = _step.value;

            if (f.format instanceof RegExp && f.format.test(value)) {
              return f.fn(value);
            } else if (value === f.format || value && (typeof value.indexOf === 'function' ? value.indexOf(f.format) : undefined) === 0) {
              return f.fn(value);
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        return null;
      }
    }, {
      key: 'registerValueFormatter',
      value: function registerValueFormatter(formatOrPrefix, formatterFunction) {
        return this.valueFormatters.push({ format: formatOrPrefix, fn: formatterFunction });
      }
    }, {
      key: '_escapeValue',
      value: function _escapeValue(value) {
        if (typeof value !== 'string') {
          return value;
        }
        return this._wrapStringValue(value.replace(/\'/g, '\\\''));
      }
    }, {
      key: '_wrapStringValue',
      value: function _wrapStringValue(value) {
        if (value[0] === '`') {
          return value;
        }
        return '\'' + value + '\'';
      }
    }]);

    return SQLConditionBuilder;
  }();

  exports.default = SQLConditionBuilder;
  module.exports = exports['default'];
});