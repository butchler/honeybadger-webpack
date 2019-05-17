'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _verror = require('verror');

var _verror2 = _interopRequireDefault(_verror);

var _lodash = require('lodash.find');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require('lodash.reduce');

var _lodash4 = _interopRequireDefault(_lodash3);

var _helpers = require('./helpers');

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HoneybadgerSourceMapPlugin = function () {
  function HoneybadgerSourceMapPlugin(_ref) {
    var apiKey = _ref.apiKey,
        assetsUrl = _ref.assetsUrl,
        _ref$revision = _ref.revision,
        revision = _ref$revision === undefined ? "master" : _ref$revision,
        _ref$silent = _ref.silent,
        silent = _ref$silent === undefined ? false : _ref$silent,
        _ref$uploadConcurrenc = _ref.uploadConcurrency,
        uploadConcurrency = _ref$uploadConcurrenc === undefined ? Infinity : _ref$uploadConcurrenc,
        _ref$ignoreErrors = _ref.ignoreErrors,
        ignoreErrors = _ref$ignoreErrors === undefined ? false : _ref$ignoreErrors;
    (0, _classCallCheck3.default)(this, HoneybadgerSourceMapPlugin);

    this.apiKey = apiKey;
    this.assetsUrl = assetsUrl;
    this.revision = revision;
    this.silent = silent;
    this.ignoreErrors = ignoreErrors;
    this.uploadConcurrency = uploadConcurrency;
  }

  (0, _createClass3.default)(HoneybadgerSourceMapPlugin, [{
    key: 'afterEmit',
    value: function afterEmit(compilation, done) {
      var _this = this;

      var errors = (0, _helpers.validateOptions)(this);

      if (errors) {
        var _compilation$errors;

        (_compilation$errors = compilation.errors).push.apply(_compilation$errors, (0, _toConsumableArray3.default)((0, _helpers.handleError)(errors)));
        return done();
      }

      this.uploadSourceMaps(compilation, function (err) {
        if (err) {
          if (!_this.ignoreErrors) {
            var _compilation$errors2;

            (_compilation$errors2 = compilation.errors).push.apply(_compilation$errors2, (0, _toConsumableArray3.default)((0, _helpers.handleError)(err)));
          } else if (!_this.silent) {
            var _compilation$warnings;

            (_compilation$warnings = compilation.warnings).push.apply(_compilation$warnings, (0, _toConsumableArray3.default)((0, _helpers.handleError)(err)));
          }
        }
        done();
      });
    }
  }, {
    key: 'apply',
    value: function apply(compiler) {
      if (compiler.hooks) {
        compiler.hooks.afterEmit.tapAsync(_constants.PLUGIN_NAME, this.afterEmit.bind(this));
      } else {
        compiler.plugin('after-emit', this.afterEmit.bind(this));
      }
    }
  }, {
    key: 'getAssets',
    value: function getAssets(compilation) {
      var _compilation$getStats = compilation.getStats().toJson(),
          chunks = _compilation$getStats.chunks;

      return (0, _lodash4.default)(chunks, function (result, chunk) {
        var chunkName = chunk.names[0];

        var sourceFile = (0, _lodash2.default)(chunk.files, function (file) {
          return (/\.js$/.test(file)
          );
        });
        var sourceMap = (0, _lodash2.default)(chunk.files, function (file) {
          return (/\.js\.map$/.test(file)
          );
        });

        if (!sourceFile || !sourceMap) {
          return result;
        }

        return [].concat((0, _toConsumableArray3.default)(result), [{ sourceFile: sourceFile, sourceMap: sourceMap }]);
      }, {});
    }
  }, {
    key: 'uploadSourceMap',
    value: function uploadSourceMap(compilation, _ref2, done) {
      var _this2 = this;

      var sourceFile = _ref2.sourceFile,
          sourceMap = _ref2.sourceMap;

      var req = _request2.default.post(_constants.ENDPOINT, function (err, res, body) {
        if (!err && res.statusCode === 201) {
          if (!_this2.silent) {
            console.info('Uploaded ' + sourceMap + ' to Honeybadger API'); // eslint-disable-line no-console
          }
          return done();
        }

        var errMessage = 'failed to upload ' + sourceMap + ' to Honeybadger API';
        if (err) {
          return done(new _verror2.default(err, errMessage));
        }

        var result = void 0;

        try {
          var _JSON$parse = JSON.parse(body),
              error = _JSON$parse.error;

          result = new Error(error ? errMessage + ': ' + error : errMessage);
        } catch (parseErr) {
          result = new _verror2.default(parseErr, errMessage);
        }

        return done(result);
      });

      var form = req.form();
      form.append('api_key', this.apiKey);
      form.append('minified_url', this.assetsUrl.toString().replace(/^\//, '') + '/' + sourceFile.replace(/^\//, ''));
      form.append('minified_file', compilation.assets[sourceFile].source(), {
        filename: sourceFile,
        contentType: 'application/javascript'
      });
      form.append('source_map', compilation.assets[sourceMap].source(), {
        filename: sourceMap,
        contentType: 'application/octet-stream'
      });
      form.append('revision', this.revision);
    }
  }, {
    key: 'uploadSourceMaps',
    value: function uploadSourceMaps(compilation, done) {
      var _this3 = this;

      var assets = this.getAssets(compilation);
      var tasks = assets.map(function (asset) {
        return function (done) {
          return _this3.uploadSourceMap(compilation, asset, done);
        };
      });

      _async2.default.parallelLimit(tasks, this.uploadConcurrency, function (err, results) {
        if (err) {
          return done(err);
        }
        return done(null, results);
      });
    }
  }]);
  return HoneybadgerSourceMapPlugin;
}();

module.exports = HoneybadgerSourceMapPlugin;