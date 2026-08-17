// Express 4 doesn't catch rejected promises from async handlers on its own —
// wrap each route so a thrown/rejected error reaches the error middleware
// instead of crashing the request silently.
module.exports = function asyncRoute(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
