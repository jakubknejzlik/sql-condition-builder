squel = require('squel')


class SQLConditionBuilder extends Object
  constructor:()->
    super
    @valueFormatters = []

    @registerValueFormatter null,(value)=>
      return 'IS NULL'
    @registerValueFormatter 'null',(value)=>
      return 'IS NULL'
    @registerValueFormatter '!null',(value)=>
      return 'IS NOT NULL'
    @registerValueFormatter '>=',(value)=>
      return ">= " + @_escapeValue(value.substring(2))
    @registerValueFormatter '>',(value)=>
      return "> " + @_escapeValue(value.substring(1))
    @registerValueFormatter '<=',(value)=>
      return "<= " + @_escapeValue(value.substring(2))
    @registerValueFormatter '<',(value)=>
      return "< " + @_escapeValue(value.substring(1))
    @registerValueFormatter '!',(value)=>
      return "<> " + @_escapeValue(value.substring(1))
    @registerValueFormatter /[\*\?]+/,(value)=>
      return "LIKE " + @_escapeValue(value.replace(/\*/g,'%').replace(/\?/,'_'))
    @registerValueFormatter /\[.+ TO .+\]/,(value)=>
      splitted = value.substring(1,value.length-1).split(' TO ')
      return "BETWEEN " + @_escapeValue(splitted[0]) + " AND " + @_escapeValue(splitted[1])

  build:(object)->
    expr = @getExpression(object)
    return expr.toString()

  getExpression:(objectOrArray)->
    expr = squel.expr()
    if Array.isArray(objectOrArray)
      @_buildExpressionWithArray(expr,objectOrArray)
    else
      @_buildExpressionWithObject(expr,objectOrArray)

    return expr


  _buildExpressionWithArray:(expr,array)->
    for value in array
      if value instanceof Object
        expr.or_begin()
        expr.or(@build(value))
        expr.end()
      else
        expr.or(value)

  _buildExpressionWithObject:(expr,object)->
    for key,value of object
      if value instanceof Object
        expr.and('(' + @build(value) + ')')
      else
        parsedValue = @_parseValue(value)
        if parsedValue
          expr.and(key + ' ' + parsedValue)
        else
          expr.and(key + ' = ' + @_escapeValue(value))


  _parseValue:(value)->
    for f in @valueFormatters
      if f.format instanceof RegExp and f.format.test(value)
        return f.fn(value)
      else if value is f.format or (value and value.indexOf?(f.format) is 0)
        return f.fn(value)
    return null


  registerValueFormatter:(formatOrPrefix,formatterFunction)->
    @valueFormatters.push({format:formatOrPrefix,fn:formatterFunction})

  _escapeValue:(value)->
    if typeof value isnt 'string'
      return value
    return @_wrapStringValue(value.replace(/\'/g,'\\\''))

  _wrapStringValue:(value)->
    if value[0] is '`'
      return value
    return "'" + value + "'"

module.exports = SQLConditionBuilder
