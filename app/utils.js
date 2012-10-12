// Utils.js - Simple helpers
// =========================

// Validation helper
exports.isBetween = function(min, max, value) {
  return value.length >= min && value.length <= max;
};

// Extend objects
//
//     utils.extend(this.settings, {
//       sort: 'DESC'
//     }, settings);
//
exports.extend = function() {
  var args = Array.prototype.slice.call(arguments)
    , dest = args.shift();

  args.forEach(function(source) {
    Object.keys(source).forEach(function(key) {
      dest[key] = source[key];
    });
  });

  return dest;
};
