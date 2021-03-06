/**
 * The plugin on enhanced-resolver to map module path
 * @author imcuttle
 */

const minimatch = require('minimatch')

function isMatch(rule, value) {
  if (!rule) return false

  if (Array.isArray(rule)) {
    return rule.some(rule => {
      return isMatch(rule, value)
    })
  }

  if (rule instanceof RegExp) {
    return rule.test(value)
  }

  if (typeof rule === 'function') {
    return !!rule(value)
  }

  if (value && typeof value === 'string' && typeof rule === 'string' && value.startsWith(rule)) {
    return true
  }

  return value && minimatch(value, rule, { matchBase: false })
}

function replaceRoot(value, root) {
  return value && value.replace(/<root>/g, root)
}

function normalizeMapper(mapper, replace) {
  if (mapper && typeof mapper !== 'function') {
    const map = {}
    for (let [key, value] of Object.entries(mapper)) {
      map[replace(key)] = typeof value === 'string' ? replace(value) : value
    }
    mapper = filename => {
      for (let [regStr, replacer] of Object.entries(map)) {
        if (new RegExp(regStr).test(filename)) {
          return filename.replace(new RegExp(regStr), replacer)
        }
      }

      return filename
    }
  }

  if (typeof mapper === 'function') {
    return (input, req, cb) => {
      // without callback
      if (mapper.length < 3) {
        return cb(null, mapper(input, req))
      }

      return mapper(input, req, cb)
    }
  }

  return mapper
}

function normalizeOptions(opts) {
  opts = Object.assign(
    {
      root: null,
      include: [],
      exclude: [],
      silent: true,
      mapper: null,
      requestMapper: null
    },
    opts
  )
  const replace = value => (opts.root ? replaceRoot(value, opts.root) : value)

  if (opts.root) {
    if (!opts.include.length) {
      opts.include = opts.include.concat(opts.root)
    }
    opts.include = opts.include.map(replace)
    opts.exclude = opts.exclude.map(replace)
  }

  opts.mapper = normalizeMapper(opts.mapper, replace)
  opts.requestMapper = normalizeMapper(opts.requestMapper, replace)

  return opts
}

class AbsoluteModuleMapperPlugin {
  constructor(options) {
    this.options = normalizeOptions(options || {})
  }

  get name() {
    return this.constructor.displayName || this.constructor.name
  }

  apply(resolver) {
    const { mapper, requestMapper, include, exclude, root, silent } = this.options

    if (requestMapper) {
      resolver.getHook('resolve').tapAsync(this.name, (request, resolveContext, callback) => {
        const from = request.context.issuer
        if (from && isMatch(include, from) && !isMatch(exclude, from)) {
          const old = request.request
          requestMapper(old, request, (error, result) => {
            if (error) callback(error)
            else {
              request.request = replaceRoot(result || old, root)

              !silent &&
                old !== request.request &&
                console.log(this.name + ' resolveRequest: in %s\n  %s => %s', from, old, request.request)

              callback()
            }
          })
        }
        else {
          callback()
        }
      })
    }

    if (mapper) {
      resolver.getHook('existingFile').tapAsync(this.name, (request, resolveContext, callback) => {
        const from = request.context.issuer
        if (from && isMatch(include, from) && !isMatch(exclude, from)) {
          const old = request.path

          mapper(old, request, (error, result) => {
            if (error) callback(error)
            else {
              request.path = replaceRoot(result || old, root)
              !silent &&
                old !== request.path &&
                console.log(this.name + ' path: in %s\n  %s => %s', from, old, request.path)
              callback()
            }
          })
        }
        else {
          callback()
        }
      })
    }
  }
}
AbsoluteModuleMapperPlugin.isMatch = isMatch
AbsoluteModuleMapperPlugin.replaceRoot = replaceRoot
AbsoluteModuleMapperPlugin.isMatch = normalizeOptions

module.exports = AbsoluteModuleMapperPlugin
