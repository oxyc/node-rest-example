// App.js - Main Application
// =========================
// _Configure the rest service and initialize models/routes/etc._

var restify = require('restify')
  , config = require('../config')
  , app = module.exports = restify.createServer(config.restify)
  , models = require('./models')
  , routes = require('./routes')
  , db, mongoose, User, Player;

// Setup the database connection
app.mongoose = mongoose = require('mongoose');
app.db = db = app.mongoose.createConnection(config.mongoose.auth, config.mongoose.options);

app.config = config;

// Authorize HTTP Basic Authentication headers.
//
// *The callback passed will be invoked with an error boolean*
//
//     app.authorize(auth, function(err) {
//       if (err) throw NotAuthorizedError;
//       else {
//         processRequest();
//       }
//     });

app.authorize = function(authentication, next) {
  var error = true;
  var auth = authentication.basic;
  if (!(auth && auth.username)) return next(error);

  // Check hardcoded users
  config.http_auth.forEach(function(user) {
    if (user.username === auth.username && user.password === auth.password) {
      error = false;
    }
  });
  if (!error) return next(error);

  // Check with the database users
  app.User.findOne({ name: auth.username }, function(err, user) {
    if (!err && user && user.authenticate(auth.password)) {
      next(!error);
    } else {
      next(error);
    }
  });
};

// Setup the RPC service
app
  .use(restify.queryParser({ mapParams: false }))
  .use(restify.bodyParser({ mapParams: false }))
  .use(restify.authorizationParser());

// Enable CORS by setting appropiate headers
restify.defaultResponseHeaders = function () {
  this.header('Access-Control-Allow-Origin', '*');
  this.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
};

models.defineModels(db, mongoose, function() {
  app.User = User = db.model('User');
  app.Player = Player = db.model('Player');
});

routes.defineRoutes(app, restify);

// Start the server and let's do it!
if (!module.parent) {
  app.listen(config.port || 8000, function() {
    console.log('%s listening at %s', app.name, app.url);
  });
}
