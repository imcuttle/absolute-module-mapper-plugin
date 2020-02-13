# absolute-module-mapper-plugin

[![Build status](https://img.shields.io/travis/imcuttle/absolute-module-mapper-plugin/master.svg?style=flat-square)](https://travis-ci.org/imcuttle/absolute-module-mapper-plugin)
[![Test coverage](https://img.shields.io/codecov/c/github/imcuttle/absolute-module-mapper-plugin.svg?style=flat-square)](https://codecov.io/github/imcuttle/absolute-module-mapper-plugin?branch=master)
[![NPM version](https://img.shields.io/npm/v/absolute-module-mapper-plugin.svg?style=flat-square)](https://www.npmjs.com/package/absolute-module-mapper-plugin)
[![NPM Downloads](https://img.shields.io/npm/dm/absolute-module-mapper-plugin.svg?style=flat-square&maxAge=43200)](https://www.npmjs.com/package/absolute-module-mapper-plugin)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://prettier.io/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg?style=flat-square)](https://conventionalcommits.org)

> The plugin on enhanced-resolver to map module path

It's helpful when we need to adjust third-party library dependencies. for example:

We have the follow project directory tree now.
```text
project/
   node_modules/
      antd/
         lib/
            components/
               icon/
                  index.js
               button/
                  index.js  # requires icon/index.js
               ... 
   wrapper/
      button/
         index.js
      icon/
         index.js
```

And the point is `antd/button` requires `antd/icon`, but we prefer it requires `wrapper/icon` which we can customize.

So we could use this plugin in webpack, let `antd/icon` in `antd/button` is mapped to `wrapper/icon`.

## Installation

```bash
npm install absolute-module-mapper-plugin
# or use yarn
yarn add absolute-module-mapper-plugin
```

## Usage in webpack

```javascript
const AbsoluteModuleMapperPlugin = require('absolute-module-mapper-plugin')

const webpackConfig = {
   resolve: {
      plugins: [
         new AbsoluteModuleMapperPlugin({
            root: '/project',
            include: [
               '<root>/node_modules/antd/lib/components/button'
            ],
            mapper: {
               '^<root>/node_modules/antd/lib/components/icon/index.js': '<root>/wrapper/icon/index.js'
            }
         })
      ]
   }
}
```

## Options

### `silent`
Show some runtime log
- Default: `true`

### `root`
Assign root path, it is the value for `<root>` placeholder.

- Type: `string`

### `include`
The included paths for mapping

- Type: `Array<string|Function|RegExp>`
- Default: `[options.root]`

### `exclude`
The excluded paths for mapping

- Type: `Array<string|Function|RegExp>`
- Default: `[]`

### `mapper`

absolute filename mapper.

- Type: `(filename, ctx) => string | (filename, ctx, callback) => void  | {}`
- Example
```javascript
{
   '^<root>/from/(\w+)': '<root>/to/$1'
}
```

### `requestMapper`

request mapper.

- Type: `(request, ctx) => string | (request, ctx, callback) => void | {}`
- Example
```javascript
{
   '^./a.js$': './b.js'
}
```

## Contributing

- Fork it!
- Create your new branch:  
  `git checkout -b feature-new` or `git checkout -b fix-which-bug`
- Start your magic work now
- Make sure npm test passes
- Commit your changes:  
  `git commit -am 'feat: some description (close #123)'` or `git commit -am 'fix: some description (fix #123)'`
- Push to the branch: `git push`
- Submit a pull request :)

## Authors

This library is written and maintained by imcuttle, <a href="mailto:moyuyc95@gmail.com">moyuyc95@gmail.com</a>.

## License

MIT - [imcuttle](https://github.com/imcuttle) 🐟
