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
  }

  opts.mapper = normalizeMapper(opts.mapper, replace)
  opts.requestMapper = normalizeMapper(opts.requestMapper, replace)

  return opts
}

class AbsoluteModuleMapperPlugin {
  constructor(options) {
    this.options = normalizeOptions(options || {})
  }

  apply(resolver) {
    const { mapper, requestMapper, include, root, silent } = this.options

    if (requestMapper) {
      const requestTarget = resolver.ensureHook('parsedResolve')
      resolver.getHook('resolve').tapAsync('AbsoluteModuleMapperPlugin', (request, resolveContext, callback) => {
        const from = request.context.issuer
        if (from && isMatch(include, from)) {
          const old = request.request
          requestMapper(old, request, (error, result) => {
            if (error) callback(error)
            else {
              request.request = replaceRoot(result || old, root)

              !silent &&
                old !== request.request &&
                console.log('AbsoluteModuleMapperPlugin resolveRequest: in %s\n  %s => %s', from, old, request.request)

              callback()
            }
          })
        }
      })
    }

    if (mapper) {
      const target = resolver.ensureHook('resolved')
      resolver.getHook('existingFile').tapAsync('AbsoluteModuleMapperPlugin', (request, resolveContext, callback) => {
        const from = request.context.issuer
        if (from && isMatch(include, from)) {
          const old = request.path

          mapper(old, request, (error, result) => {
            if (error) callback(error)
            else {
              request.path = replaceRoot(result || old, root)
              !silent &&
                old !== request.path &&
                console.log('AbsoluteModuleMapperPlugin path: in %s\n  %s => %s', from, old, request.path)
              callback()
            }
          })
        }
      })
    }
  }
}
AbsoluteModuleMapperPlugin.isMatch = isMatch
AbsoluteModuleMapperPlugin.replaceRoot = replaceRoot
AbsoluteModuleMapperPlugin.isMatch = normalizeOptions

module.exports = AbsoluteModuleMapperPlugin
