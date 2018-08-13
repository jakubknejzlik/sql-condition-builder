import squel from 'squel'


export default class SQLConditionBuilder {
  constructor() {
    this.valueFormatters = []

    this.registerValueFormatter(null, value => {  // eslint-disable-line no-unused-vars
      return 'IS NULL'
    })
    this.registerValueFormatter('null', value => {  // eslint-disable-line no-unused-vars
      return 'IS NULL'
    })
    this.registerValueFormatter('!null', value => {  // eslint-disable-line no-unused-vars
      return 'IS NOT NULL'
    })
    this.registerValueFormatter('>=', value => {
      return `>= ${this._evalAndEscapeValue(value.substring(2))}`
    })
    this.registerValueFormatter('>', value => {
      return `> ${this._evalAndEscapeValue(value.substring(1))}`
    })
    this.registerValueFormatter('<=', value => {
      return `<= ${this._evalAndEscapeValue(value.substring(2))}`
    })
    this.registerValueFormatter('<', value => {
      return `< ${this._evalAndEscapeValue(value.substring(1))}`
    })
    this.registerValueFormatter('!', value => {
      return `<> ${this._evalAndEscapeValue(value.substring(1))}`
    })
    this.registerValueFormatter(/[\*\?]+/, value => {
      return `LIKE ${this._evalAndEscapeValue(value.replace(/\*/g, '%').replace(/\?/, '_'))}`
    })
    this.registerValueFormatter(/\[.+ TO .+\]/, value => {
      const splitted = value
        .substring(1, value.length - 1)
        .split(' TO ')
        .map(item => this._evalAndEscapeValue(item))

      const [fromValue, toValue] = splitted

      return `BETWEEN ${fromValue} AND ${toValue}`
    })
    this.registerValueFormatter(/\[(.+,)*.+\]/, value => {
      const values = value
        .substring(1, value.length - 1)
        .split(',')
        .map(item => item.trim())
        .map(item => this._evalAndEscapeValue(item))
        .join(', ')

      return `IN (${values})`
    })
  }

  build(object) {
    return this.getExpression(object).toString()
  }

  getExpression(objectOrArray) {
    const expr = squel.expr()

    if (Array.isArray(objectOrArray)) {
      this._buildExpressionWithArray(expr, objectOrArray)
    } else {
      this._buildExpressionWithObject(expr, objectOrArray)
    }

    return expr
  }


  _buildExpressionWithArray(expr, array) {
    return Array.from(array).map((value) =>
      value instanceof Object ?
        expr.or(this.build(value))
        :
        expr.or(value))
  }

  _buildExpressionWithObject(expr, object) {
    return (() => {
      const result = []

      for (const key in object) {
        const value = object[key]

        if (value instanceof Object) {
          result.push(expr.and(`(${this.build(value)})`))
        } else {
          const parsedValue = this._parseValue(value)

          if (parsedValue) {
            result.push(expr.and(`${key} ${parsedValue}`))
          } else {
            result.push(expr.and(`${key} = ${this._escapeValue(value)}`))
          }
        }
      }

      return result
    })()
  }

  _parseValue(value) {
    for (const f of Array.from(this.valueFormatters)) {
      if (f.format instanceof RegExp && f.format.test(value)) {
        return f.fn(value)
      } else if ((value === f.format) || (value && ((typeof value.indexOf === 'function' ? value.indexOf(f.format) : undefined) === 0))) {
        return f.fn(value)
      }
    }
    return null
  }

  registerValueFormatter(formatOrPrefix, formatterFunction) {
    return this.valueFormatters.push({ format: formatOrPrefix, fn: formatterFunction })
  }

  _escapeValue(value) {
    if (typeof value !== 'string') {
      return value
    }

    return this._wrapStringValue(value.replace(/\'/g, '\\\''))
  }

  _evalAndEscapeValue(value) {
    // Return value as is if it's a valid number
    if (!isNaN(value)) {
      return value
    }

    // Strings can be enclosed by double quotes,
    // parse them for correctness or keep them as is if not correctly wrapper by duoble quotes
    try {
      value = JSON.parse(value)
    } catch (e) {
      // eslint disable-line no-empty
    }

    // Return string encoded and wrapped in single quotes
    return this._escapeValue(value)
  }

  _wrapStringValue(value) {
    return value[0] === '`' ? value : `'${value}'`
  }
}
