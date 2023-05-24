# TS Reactive Forms

 [![NPM version][npm-version-image]][npm-url]
 [![Build Status][travis-image]][travis-url]
 [![Coverage Status][test-coverage-image]][test-coverage-url] ![PRs welcome][contributing-image]
 [![Size](https://img.shields.io/bundlephobia/min/ts-reactive-forms)](https://img.shields.io/bundlephobia/minzip/ts-reactive-forms)

A library to have the power of reactive forms (these are a strict reproduction of Angular ones, taken from v 15.2.x).
Just note that at this time we don't have adapters for the various frameworks.
I'm using this lib in a Vue project and I will add the Vue directive under a scoped package

## Getting Started

### Installing

You can install ts-reactive-forms by simply downloading the umd js file,
or if you have node installed you can use the following command

```
$ path-to-project/ npm install ts-reactive-forms
```

## Running the tests

There are no actual tests, but the environment is ready to be run with `npm run test`

## Contributing

* Step 1. Clone this repo
* Step 2. Run `yarn install` in the download path
* Step 3. You can edit this library by edinting files under `src/`
* Step 4. You can edit/add tests under `test/ts-reactive-forms.test.ts` (do not edit index and js)
* Step 4. Run `npm run test`
* Step 5. If test *PASSES* you can make a pull request, otherwise, go back to step 3 and repeat.

## Special thanks

Jetbrains is now supporting this library with an open-source licence, which will allow a better code! 🎉

![jetbrains-logo](https://user-images.githubusercontent.com/5957244/150580991-863d6fba-1090-4924-b26c-be19c6310f24.svg)

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* *Initial work and devs* - [TonySamperi](https://github.com/TonySamperi)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

[npm-url]: https://npmjs.org/package/ts-reactive-forms
[npm-version-image]: https://badge.fury.io/js/ts-reactive-forms.svg
[doc-url]: https://tonysamperi.github.io/js-utils/
[doc-coverage-image]: https://moment.github.io/luxon/docs/badge.svg
[test-coverage-url]: https://codecov.io/gh/tonysamperi/js-utils
[test-coverage-image]: https://codecov.io/gh/tonysamperi/js-utils/branch/master/graph/badge.svg
[contributing-image]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg
[travis-image]: https://travis-ci.org/tonysamperi/js-utils.svg?branch=master
[travis-url]: https://travis-ci.org/tonysamperi/js-utils.svg?branch=master
