/**
 * @file main
 * @author imcuttle
 * @date 2018/4/4
 */
const AbsoluteModuleMapperPlugin = require('../')
const { fixture } = require('./helper')
const resolve = require('enhanced-resolve')
const fs = require('fs')
const {ResolverFactory, CachedInputFileSystem} = resolve;

const sync = resolve.create.sync({
  plugins: [new AbsoluteModuleMapperPlugin()]
})

const resolverOptions = {
  useSyncFileSystemCalls: true,
  fileSystem: new CachedInputFileSystem(fs, 4000),
  extensions: [".js", ".json"],
}

describe('absoluteModuleMapperPlugin', function() {
  it('simple case', function() {
    expect(sync(fixture(''), './module')).toBe(
      fixture('module/index.js')
    )
  })

  it('should mapper', function () {
    const resolver = ResolverFactory.createResolver({
      ...resolverOptions,
      plugins: [new AbsoluteModuleMapperPlugin({
        root: fixture(''),
        silent: false,
        mapper: {
          '^<root>/module/(\\w+)': '<root>/to/$1'
        }
      })]
    })

    const path = resolver.resolveSync({
      issuer: fixture('module/index.js')
    }, fixture('module'), './a.js')

    expect(path).toBe(fixture('to/a.js'))
  });


  it('should mapper async', function (done) {
    const resolver = ResolverFactory.createResolver({
      ...resolverOptions,
      plugins: [new AbsoluteModuleMapperPlugin({
        root: fixture(''),
        silent: false,
        mapper: (path, ctx, cb) => {
          cb(null, path.replace(new RegExp('/module/(\\w+)'), '/to/$1'))
        }
      })]
    })

    resolver.resolve({
      issuer: fixture('module/index.js')
    }, fixture('module'), './a.js', {}, (err, result) => {
      expect(result).toBe(fixture('to/a.js'))
      done(err)
    })
  });

  it('should requestMapper', function () {
    const resolver = ResolverFactory.createResolver({
      ...resolverOptions,
      plugins: [new AbsoluteModuleMapperPlugin({
        root: fixture(''),
        silent: false,
        requestMapper: {
          '^./a.js': '<root>/to/b.js'
        }
      })]
    })

    const path = resolver.resolveSync({
      issuer: fixture('module/index.js')
    }, fixture('module'), './a.js')

    expect(path).toBe(fixture('to/b.js'))
  });

  it('should mapper & requestMapper', function () {
    const resolver = ResolverFactory.createResolver({
      ...resolverOptions,
      plugins: [new AbsoluteModuleMapperPlugin({
        root: fixture(''),
        silent: false,
        requestMapper: {
          '^./a.js': '<root>/module/b.js'
        },
        mapper: {
          '^<root>/module/(\\w+)': '<root>/to/$1'
        }
      })]
    })

    const path = resolver.resolveSync({
      issuer: fixture('module/index.js')
    }, fixture('module'), './a.js')

    expect(path).toBe(fixture('to/b.js'))
  });
})
