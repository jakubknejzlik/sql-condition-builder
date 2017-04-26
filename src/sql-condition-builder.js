import squel from 'squel';


export default class SQLConditionBuilder {
  constructor() {
    this.valueFormatters = [];

    this.registerValueFormatter(null, value => {  // eslint-disable-line no-unused-vars
      return 'IS NULL';
    });
    this.registerValueFormatter('null', value => {  // eslint-disable-line no-unused-vars
      return 'IS NULL';
    });
    this.registerValueFormatter('!null', value => {  // eslint-disable-line no-unused-vars
      return 'IS NOT NULL';
    });
    this.registerValueFormatter('>=', value => {
      return `>= ${this._escapeValue(value.substring(2))}`;
    });
    this.registerValueFormatter('>', value => {
      return `> ${this._escapeValue(value.substring(1))}`;
    });
    this.registerValueFormatter('<=', value => {
      return `<= ${this._escapeValue(value.substring(2))}`;
    });
    this.registerValueFormatter('<', value => {
      return `< ${this._escapeValue(value.substring(1))}`;
    });
    this.registerValueFormatter('!', value => {
      return `<> ${this._escapeValue(value.substring(1))}`;
    });
    this.registerValueFormatter(/[\*\?]+/, value => {
      return `LIKE ${this._escapeValue(value.replace(/\*/g, '%').replace(/\?/, '_'))}`;
    });
    this.registerValueFormatter(/\[.+ TO .+\]/, value => {
      let splitted = value.substring(1, value.length - 1).split(' TO ');
      return `BETWEEN ${this._escapeValue(splitted[0])} AND ${this._escapeValue(splitted[1])}`;
    });
    this.registerValueFormatter(/\[(.+,)*.+\]/, value => {
      let values = value.substring(1, value.length - 1).split(',');
      return `IN (${values.map(item => this._escapeValue(item.replace(/^["]+|["]+$/g, "")))})`;
    });
  }

  build(object) {
    let expr = this.getExpression(object);
    return expr.toString();
  }

  getExpression(objectOrArray) {
    let expr = squel.expr();
    if (Array.isArray(objectOrArray)) {
      this._buildExpressionWithArray(expr, objectOrArray);
    } else {
      this._buildExpressionWithObject(expr, objectOrArray);
    }

    return expr;
  }


  _buildExpressionWithArray(expr, array) {
    return Array.from(array).map((value) =>
      value instanceof Object ?
        expr.or(this.build(value))
        :
        expr.or(value));
  }

  _buildExpressionWithObject(expr, object) {
    return (() => {
      let result = [];
      for (let key in object) {
        let value = object[key];
        if (value instanceof Object) {
          result.push(expr.and(`(${this.build(value)})`));
        } else {
          let parsedValue = this._parseValue(value);
          if (parsedValue) {
            result.push(expr.and(key + ' ' + parsedValue));
          } else {
            result.push(expr.and(key + ' = ' + this._escapeValue(value)));
          }
        }
      }
      return result;
    })();
  }


  _parseValue(value) {
    for (let f of Array.from(this.valueFormatters)) {
      if (f.format instanceof RegExp && f.format.test(value)) {
        return f.fn(value);
      } else if ((value === f.format) || (value && ((typeof value.indexOf === 'function' ? value.indexOf(f.format) : undefined) === 0))) {
        return f.fn(value);
      }
    }
    return null;
  }


  registerValueFormatter(formatOrPrefix, formatterFunction) {
    return this.valueFormatters.push({ format: formatOrPrefix, fn: formatterFunction });
  }

  _escapeValue(value) {
    if (typeof value !== 'string') {
      return value;
    }
    return this._wrapStringValue(value.replace(/\'/g, '\\\''));
  }

  _wrapStringValue(value) {
    if (value[0] === '`') {
      return value;
    }
    return `'${value}'`;
  }
}
