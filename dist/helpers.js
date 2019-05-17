'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

exports.handleError = handleError;
exports.validateOptions = validateOptions;

var _verror = require('verror');

var _verror2 = _interopRequireDefault(_verror);

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function handleError(err) {
  var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'HoneybadgerSourceMapPlugin';

  if (!err) {
    return [];
  }

  var errors = [].concat(err);
  return errors.map(function (e) {
    return new _verror2.default(e, prefix);
  });
}

function validateOptions(ref) {
  var errors = _constants.REQUIRED_FIELDS.reduce(function (result, field) {
    if (ref && ref[field]) {
      return result;
    }

    return [].concat((0, _toConsumableArray3.default)(result), [new Error('required field, \'' + field + '\', is missing.')]);
  }, []);

  return errors.length ? errors : null;
}