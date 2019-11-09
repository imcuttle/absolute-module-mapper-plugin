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

function normalizeOptions(opts) {
  opts = Object.assign(
    {
      root: null,
      include: [],
      silent: true,
      mapper: null
    },
    opts
  )

  if (opts.root) {
    const replace = value => replaceRoot(value, opts.root)

    if (!opts.include.length) {
      opts.include = opts.include.concat(opts.root)
    }
    opts.include = opts.include.map(replace)

    if (opts.mapper && typeof opts.mapper !== 'function') {
      const map = {}
      for (let [key, value] of Object.entries(opts.mapper)) {
        map[replace(key)] = typeof value === 'string' ? replace(value) : value
      }
      opts.mapper = map;

      const mapObj = opts.mapper
      opts.mapper = filename => {
        for (let [regStr, replacer] of Object.entries(mapObj)) {
          if (new RegExp(regStr).test(filename)) {
            return filename.replace(new RegExp(regStr), replacer)
          }
        }

        return filename
      }
    }
  }

  return opts
}

class AbsoluteModuleMapperPlugin {
  constructor(options) {
    this.options = normalizeOptions(options || {})
  }

  apply(resolver) {
    const target = resolver.ensureHook('resolved')
    const { mapper, include, root, silent } = this.options
    resolver.getHook('existingFile').tapAsync('AbsoluteModuleMapperPlugin', (request, resolveContext, callback) => {
      const from = request.context.issuer

      if (from && mapper && isMatch(include, from)) {
        const old = request.path
        request.path = replaceRoot(mapper(request.path, request), root)

        !silent && old !== request.path && console.log('AbsoluteModuleMapperPlugin: in %s\n  %s => %s', from, old, request.path)
      }
      resolver.doResolve(target, request, null, resolveContext, callback)
    })
  }
}
AbsoluteModuleMapperPlugin.isMatch = isMatch;
AbsoluteModuleMapperPlugin.replaceRoot = replaceRoot;
AbsoluteModuleMapperPlugin.isMatch = normalizeOptions;

module.exports = AbsoluteModuleMapperPlugin