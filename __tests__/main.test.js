/**
 * @file main
 * @author imcuttle
 * @date 2018/4/4
 */
const AbsoluteModuleMapperPlugin = require('../')
const { fixture } = require('./helper')
const resolve = require('enhanced-resolve')
const fs = require('fs')
const { ResolverFactory, CachedInputFileSystem } = resolve

const plugin = {
  apply(resolver) {
    const registerHook = name => {
      resolver.getHook(name).tapAsync('AbsoluteModuleMapperPlugin', (request, resolveContext, callback) => {
        console.log('name', name)
        console.log('request', request)
        console.log('resolveContext', resolveContext)
        callback()
      })
    }


    registerHook("resolve");
    registerHook("parsedResolve");
    registerHook("describedResolve");
    registerHook("rawModule");
    registerHook("module");
    registerHook("relative");
    registerHook("describedRelative");
    registerHook("directory");
    registerHook("existingDirectory");
    registerHook("undescribedRawFile");
    registerHook("rawFile");
    registerHook("file");
    registerHook("existingFile");
    registerHook("resolved");

  }
}

const sync = resolve.create.sync({
  plugins: [new AbsoluteModuleMapperPlugin()]
})

const resolverOptions = {
  useSyncFileSystemCalls: true,
  fileSystem: new CachedInputFileSystem(fs, 4000),
  extensions: ['.js', '.json']
}

describe('absoluteModuleMapperPlugin', function() {
  it('simple case', function() {
    expect(sync(fixture(''), './module')).toBe(fixture('module/index.js'))
  })

  it('should mapper', function() {
    const resolver = ResolverFactory.createResolver({
      ...resolverOptions,
      plugins: [
        new AbsoluteModuleMapperPlugin({
          root: fixture(''),
          silent: false,
          mapper: {
            '^<root>/module/(\\w+)': '<root>/to/$1'
          }
        }),
      ]
    })

    const path = resolver.resolveSync(
      {
        issuer: fixture('module/index.js')
      },
      fixture('module'),
      './a.js?query'
    )

    expect(path).toBe(fixture('to/a.js?query'))
  })

  it('should mapper exclude node_modules', function() {
    const resolver = ResolverFactory.createResolver({
      ...resolverOptions,
      plugins: [
        new AbsoluteModuleMapperPlugin({
          root: fixture(''),
          silent: false,
          // include: [
          //   '**{,/}!node_modules{,/}**'
          // ],
          exclude: ['**/node_modules/**'],
          mapper: {
            '^<root>/module/(\\w+)': '<root>/to/$1'
          }
        })
      ]
    })

    const path = resolver.resolveSync(
      {
        issuer: fixture('node_modules/index.js')
      },
      fixture('module'),
      './a.js'
    )

    expect(path).toBe(fixture('module/a.js'))
  })

  it('should mapper async', function(done) {
    const resolver = ResolverFactory.createResolver({
      ...resolverOptions,
      plugins: [
        new AbsoluteModuleMapperPlugin({
          root: fixture(''),
          silent: false,
          mapper: (path, ctx, cb) => {
            cb(null, path.replace(new RegExp('/module/(\\w+)'), '/to/$1'))
          }
        })
      ]
    })

    resolver.resolve(
      {
        issuer: fixture('module/index.js')
      },
      fixture('module'),
      './a.js?query',
      {},
      (err, result) => {
        expect(result).toBe(fixture('to/a.js?query'))
        done(err)
      }
    )
  })

  it('should requestMapper', function() {
    const resolver = ResolverFactory.createResolver({
      ...resolverOptions,
      plugins: [
        new AbsoluteModuleMapperPlugin({
          root: fixture(''),
          silent: false,
          requestMapper: {
            '^./a.js': '<root>/to/b.js'
          }
        })
      ]
    })

    const path = resolver.resolveSync(
      {
        issuer: fixture('module/index.js')
      },
      fixture('module'),
      './a.js?query'
    )

    expect(path).toBe(fixture('to/b.js?query'))
  })

  it('should mapper & requestMapper', function() {
    const resolver = ResolverFactory.createResolver({
      ...resolverOptions,
      plugins: [
        new AbsoluteModuleMapperPlugin({
          root: fixture(''),
          silent: false,
          requestMapper: {
            '^./a.js': '<root>/module/b.js'
          },
          mapper: {
            '^<root>/module/(\\w+)': '<root>/to/$1'
          }
        })
      ]
    })

    const path = resolver.resolveSync(
      {
        issuer: fixture('module/index.js')
      },
      fixture('module'),
      './a.js'
    )

    expect(path).toBe(fixture('to/b.js'))
  })
})
