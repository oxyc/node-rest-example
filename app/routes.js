// Routes.js - Define RPC endpoints
// ================================

var utils = require('./utils');

function defineRoutes(app, restify, fn) {

  // Helpers
  // -------
  //
  // A simple wrapper which authorizes the request before calling the actual
  // callback as if nothing had happened.
  function preamble(fn, req, res, next) {
    res = res; // Stupid jshint bug
    var args = Array.prototype.slice.call(arguments, 1);
    app.authorize(req.authorization, function(err) {
      if (!err) {
        next(fn.apply(this, args));
      } else {
        next(new restify.NotAuthorizedError());
      }
    });
  }

  // Routes
  // ------
  //
  // ### Return a list of player names.
  //
  // The response will have `200 OK` status code.
  //
  //     client.get('/players', fn);
  //
  function playersGetAll(req, res, next) {
    app.Player
      .find(req.query)
      .sort('name')
      .select('name -_id')
      .exec(function(err, doc) {
        if (err) return next(err);
        if (!doc) return next(new restify.ResourceNotFoundError());
        res.header('Access-Control-Allow-Methods', 'GET, POST');
        res.json(doc);
        next();
      });
  }

  // ### Return a single player with all attached properties.
  //
  // _Note, If the players name contains spaces or other non-ascii characters
  // you should URI encode it._
  //
  // The response will have `200 OK` status code on success and a `404
  // Resource Not Found` if there are no results.
  //
  //     client.get('/players/Oskar', fn);
  //
  function playersGet(req, res, next) {
    app.Player
      .findOne({ name: req.params.name })
      .exec(function (err, doc) {
        if (err) return next(err);
        if (!doc) return next(new restify.ResourceNotFoundError());
        res.header('Access-Control-Allow-Methods', 'GET, PUT, DELETE');
        res.json(doc);
        next();
      });
  }

  // ### Create a new player, only the name is required in the POST request.
  //
  // The response will have `201 Created` status code on success and a `422
  // Unprocessable Entity` on failure.
  //
  //     client.post('/players', { name: 'Oskar' }, fn);
  //
  function playersCreate(req, res, next) {
    var player = utils.extend(new app.Player(), req.body);
    player.save(function(err, doc) {
      if (err) return next(err);
      if (!doc) return next(res.send(422)); // Unprocessable Entity
      var location = app.config.http_server.url + '/player/' + doc.name;
      res.header('Access-Control-Allow-Methods', 'GET, PUT, DELETE');
      // Try to comply with REST architecture as much as possible and return
      // the resources location as a header.
      res.header('Location', location);
      res.contentType = 'json';
      res.send(201, doc);
      next();
    });
  }

  // ### Update a player.
  //
  // The response will have `200 OK` status code on success and a `404
  // Resource Not Found` on failure.
  //
  //     client.put('/players/Oskar', { name: 'OskarS' }, fn);
  //
  function playersUpdate(req, res, next) {
    app.Player
      .findOneAndUpdate({ name: req.params.name }, req.body)
      .exec(function (err, doc) {
        if (err) return next(err);
        if (!doc) return next(new restify.ResourceNotFoundError());
        res.header('Access-Control-Allow-Methods', 'GET, PUT, DELETE');
        res.json(doc);
        next();
      });
  }

  // ### Delete a player.
  //
  // The response will have `410 Gone` status code on success and a `404
  // Resource Not Found` on failure.
  //
  //     client.del('/players/Oskar', fn);
  //
  function playersDelete(req, res, next) {
    app.Player
      .findOneAndRemove({ name: req.params.name })
      .exec(function (err, doc) {
        if (err) return next(err);
        if (!doc) return next(new restify.ResourceNotFoundError());
        res.send(410);
        next();
      });
  }

  // ### Return a list of all player statistics
  //
  // The response will have `200 OK` status code on success and a `404
  // Resource Not Found` on failure.
  //
  //     client.get('/statistics', fn);
  //
  function statisticsGet(req, res, next) {
    app.Player
      .find(req.query)
      .exec(function (err, doc) {
        if (err) return next(err);
        if (!doc) return next(new restify.ResourceNotFoundError());
        res.header('Access-Control-Allow-Methods', 'GET, POST');
        res.json(doc);
      });
  }

  // ### Update the player statistics
  //
  // The request body should be an array of Player objects containing the
  // additions to goals and assists. Each time this method is run the games
  // counter will be incremented.
  //
  // The response will have `200 OK` status code on success and a `404
  // Resource Not Found` on failure.
  //
  //     data = [{ name: 'Oskar', goals: 1}, { name: 'Alex', assists: 1}];
  //     client.post('/statistics', data, fn);
  //
  function statisticsSave(req, res, next) {
    var data = {};
    req.body.forEach(function(el) {
      data[el.name] = el; delete data[el.name].name;
    });

    app.Player
      .find()
      .in('name', Object.keys(data))
      .exec(function (err, doc) {
        if (err) return next(err);
        if (!doc) return next(new restify.ResourceNotFoundError());
        // Iterate over the players models, updating their statistics and saving.
        doc.forEach(function(model) {
          Object.keys(data[model.name]).forEach(function(key) {
            model[key] += data[model.name][key];
          });
          model.games++;
          model.save();
        });
        res.header('Access-Control-Allow-Methods', 'GET, POST');
        res.json(doc);
      });
  }

  // Expose the routes.
  app.get('/players', preamble.bind(app, playersGetAll));
  app.post('/players', preamble.bind(app, playersCreate));
  app.get('/players/:name', preamble.bind(app, playersGet));
  app.put('/players/:name', preamble.bind(app, playersUpdate));
  app.del('/players/:name', preamble.bind(app, playersDelete));
  app.post('/statistics', preamble.bind(app, statisticsSave));
  app.get('/statistics', preamble.bind(app, statisticsGet));

  if (fn) fn();
}
exports.defineRoutes = defineRoutes;
