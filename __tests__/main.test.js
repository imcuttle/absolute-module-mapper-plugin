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
})
