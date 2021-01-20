const parser = require('./parser')

module.exports = function executeScript(input, script) {
  const opCodes = parser.parse(script)

  return evaluateOpCodes([input], opCodes)
}

function evaluateOpCodes(context, opCodes, callback) {
  if (!Array.isArray(opCodes)) {
    opCodes = [opCodes]
  }

  do {
    const opCode = opCodes.shift()

    switch (opCode.op) {
      case 'current_context':
        break

      case 'literal':
        context = [opCode.value]
        break

      case 'pick':
        context = context.reduce((result, each) => {
          if (each != null && typeof each !== 'object') {
            if (opCode.strict) {
              throw new Error(`Cannot index ${typeof each} with ${opCode.key}`)
            }
            // Skip this value entirely
            return result
          }
          let picked = each[opCode.key]
          result.push(picked)
          return result
        }, [])
        break

      case 'index':
        context = context.reduce((result, each) => {
          if (!Array.isArray(each)) {
            if (opCode.strict) {
              throw new Error('Can only index into arrays')
            }
            return result
          }
          let indexed
          if (Math.abs(opCode.index) > each.length || opCode.index === each.length) {
            indexed = null
          } else if (opCode.index < 0) {
            indexed = each.slice(opCode.index)[0]
          } else {
            indexed = each[opCode.index]
          }
          result.push(indexed)
          return result
        }, [])
        break

      case 'slice':
        context = context.reduce((result, each) => {
          if ('undefined' === typeof each.slice) {
            if (opCode.strict) {
              throw new Error('Cannot slice ' + typeof each)
            }
            return result
          }
          if (undefined === opCode.start && undefined === opCode.end) {
            throw new Error('Cannot slice with no offsets')
          }
          result.push(each.slice(opCode.start, opCode.end))
          return result
        }, [])
        break

      case 'explode':
        context = context.reduce((result, each) => {
          if (Array.isArray(each)) {
            return result.concat(each)
          } else if (typeof each === 'object' && each != null) {
            return result.concat(Object.values(each))
          }

          if (opCode.strict) {
            let type = typeof each
            if (each === null) {
              // jq throws an error specifically for null, so let's
              // distinguish that from object.
              type = 'null'
            }
            throw new Error('Cannot iterate over ' + type)
          }
          return result
        }, [])
        if (callback) {
          callback(context.length)
        }
        break

      case 'create_array':
        context = [ opCode.values.reduce((result, each) => { 
          let exploded = false
          let explodedLen = 0
          function cb(len) {
            exploded = true
            explodedLen = len
            if (callback) {
              callback(len)
            }
          }
          values = evaluateOpCodes(context, [...each], cb)
          if (!exploded) {
            result.push(values)
          } else {
            switch (explodedLen) {
              case 0:
                break
               
              case 1:
                result.push(values)
                break

              default:
                result = result.concat(values)
            }
          }

          return result
        }, []) ]
        break

      case 'create_object':
        function buildObject(current, ops) {
          let result = []
          let key, values
          [key, values] = ops.shift()
          values.forEach(value => {
            current[key] = value
            if (ops.length > 0) {
              result = result.concat(buildObject({...current}, [...ops]))
            } else {
              result.push({...current})
            }
          })

          return result
        }

        context = buildObject({}, Object.entries(opCode.entries.reduce((result, each) => {
          let exploded = false
          let explodedLen = 0
          function cb(len) {
            exploded = true
            explodedLen = len
            if (callback) {
              callback(len)
            }
          }
          let values = evaluateOpCodes(context, [...each.value], cb)
          if (!exploded) {
            result[each.key] = [values]
          } else {
            switch (explodedLen) {
              case 0:
                result[each.key] = []
                break
              
              case 1:
                result[each.key] = [values]
                break

              default:
                result[each.key] = values
                break
            }
          }

          return result
        }, {})))
        break

      case 'pipe':
        let exploded = false
        let explodedLen = 0
        function cb(len) {
          exploded = true
          explodedLen = len
          if (callback) {
            callback(len)
          }
        }
        context = evaluateOpCodes(context, [...opCode.in], cb)
        if (!exploded) {
          context = evaluateOpCodes([context], [...opCode.out])
        } else {
          switch (explodedLen) {
            case 0:
              context = []
              break
            
            case 1:
              context = [context]
              break
          }
          context = context.map(each => evaluateOpCodes([each], [...opCode.out]))
        }
        break

      default:
        throw new Error('Unknown op code: ' + opCode.op)
    }
  } while (opCodes.length > 0)

  return context.length > 1 ? context : context[0]
}
