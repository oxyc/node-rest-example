/*global describe:true, before:true, after:true, it:true, beforeEach:true, afterEach:true */
/*jshint es5:true */
var app = require('../')
  , restify = require('restify')
  , assert = require('assert')
  , client = restify.createJsonClient({ url: app.config.http_server.url })
  , user
  , username = 'testUser', password = 'testPassword';

before(function(done) {
  app.listen(8000);
  user = new app.User({ name: username, password: password });
  user.save(done);
});

describe('Authentication', function() {
  var player;

  beforeEach(function(done) {
    player = new app.Player({ name: 'RandomPlayer', goals: 0, assists: 2, games: 1 });
    player.save(done);
  });

  it('should send 403 with wrong authorization', function(done) {
    client.basicAuth(username, 'wrongPass');
    client.get('/players', function(err, req, res) {
      if (res.statusCode === 403) done();
    });
  });
  it('should validate authorization', function(done) {
    client.basicAuth(username, password);
    client.get('/players', function(err, req, res) {
      if (err && err.statusCode !== 404) return done(err);
      done();
    });
  });
  it('should validate hard coded users', function(done) {
    var hardcoded = require('../config.js').http_auth[0];
    client.basicAuth(hardcoded.username, hardcoded.password);
    client.get('/players', function(err, req, res) {
      if (err && err.statusCode !== 404) return done(err);
      done();
    });
  });

  afterEach(function(done) {
    player.remove(done);
  });
});

describe('Player', function() {
  var player;

  beforeEach(function(done) {
    client.basicAuth(username, password);
    player = new app.Player({ name: 'RandomPlayer', goals: 0, assists: 2, games: 1 });
    player.save(done);
  });

  it('should be able to create player', function(done) {
    client.post('/players', { name: 'RandomPlayer2' }, function(err, req, res) {
      if (err) return done(err);
      res.should.have.status(201);
      res.should.be.json;
      JSON.parse(res.body).name.should.equal('RandomPlayer2');
      done();
    });
    after(function(done) {
      app.Player.find({ name: 'RandomPlayer2' }).remove(done);
    });
  });
  it('should be able to list players', function(done) {
    client.get('/players', function(err, req, res) {
      if (err) return done(err);
      var body = JSON.parse(res.body)
        .filter(function(el) { return el.name === 'RandomPlayer'; });

      res.should.have.status(200);
      res.should.be.json;
      body.should.have.length(1);
      body[0].should.not.have.property('goals');
      body[0].should.not.have.property('_id');
      done();
    });
  });
  it('should be able to filter player list', function(done) {
    var counter = 2;
    client.get('/players?assists=1', function(err, req, res) {
      if (err && err.statusCode !== 404) return done(err);
      res.should.have.status(404);
      res.should.be.json;
      if (--counter === 0) done();
    });
    client.get('/players?assists=2', function(err, req, res) {
      if (err) return done(err);
      JSON.parse(res.body)[0].name.should.equal('RandomPlayer');
      res.should.have.status(200);
      res.should.be.json;
      if (--counter === 0) done();
    });
  });
  it('should be able to get single player', function(done) {
    client.get('/players/RandomPlayer', function(err, req, res) {
      if (err) return done(err);
      res.should.have.status(200);
      res.should.be.json;
      JSON.parse(res.body)
        .goals.should.equal(0);
      done();
    });
  });
  it('should be able to update player', function(done) {
    client.put('/players/RandomPlayer', { name: 'Oskar', goals: 1 }, function(err, req, res) {
      if (err) return done(err);
      res.should.have.status(200);
      res.should.be.json;
      JSON.parse(res.body)
        .name.should.equal('Oskar');
      JSON.parse(res.body)
        .goals.should.equal(1);
      done();
    });
  });
  it('should be able to delete player', function(done) {
    client.del('/players/RandomPlayer', function(err, req, res) {
      if (err && err.statusCode !== 410) return done(err);
      res.should.have.status(410);
      res.body.should.be.empty;
      done();
    });
  });
  it('should accept uri encoded players', function(done) {
    var encodedPlayer;

    encodedPlayer = new app.Player({ name: 'Alex Fagerström', goals: 0, assists: 2, games: 1 });
    encodedPlayer.save(function() {
      client.get('/players/' + encodeURIComponent('Alex Fagerström'), function(err, req, res) {
        encodedPlayer.remove();
        if (err) return done(err);
        res.should.have.status(200);
        res.should.be.json;
        done();
      });
    });
  });

  afterEach(function(done) {
    player.remove(done);
  });
});


describe('statistics', function() {
  var data = [
        { name: 'Oskar', goals: 1, assists: 5, games: 2 }
      , { name: 'Alex', goals: 2, assists: 4, games: 2 }
      , { name: 'Göran'}
    ]
    , user;

  beforeEach(function(done) {
    client.basicAuth(username, password);
    var length = data.length;
    data.forEach(function(data) {
      user = new app.Player(data);
      user.save(function (err, doc) {
        if (--length === 0) done();
      });
    });
  });

  it('should be able to get statistics', function(done) {
    client.get('/statistics', function(err, req, res) {
      if (err) return done(err);
      res.should.have.status(200);
      done();
    });
  });
  it('should be able to filter statistics', function(done) {
    client.get('/statistics?name=Oskar', function(err, req, res) {
      if (err) return done(err);
      res.should.have.status(200);
      var body = JSON.parse(res.body);
      body.should.have.length(1);
      body[0].name.should.equal('Oskar');
      done();
    });
  });
  it('should be able to update statistics', function(done) {
    var update = [
        { name: 'Oskar', goals: 1, assists: 5 }
      , { name: 'Alex', goals: 2, assists: 4 }
      , { name: 'Göran', goals: 3}
    ];
    client.post('/statistics', update, function(err, req, res) {
      if (err) return done(err);
      res.should.have.status(200);
      var body = JSON.parse(res.body);
      var found = false;
      body.forEach(function(el) {
        switch (el.name) {
          case 'Oskar':
            found = true;
            el.goals.should.equal(2);
            el.assists.should.equal(10);
            el.games.should.equal(3);
            break;
          case 'Göran':
            el.goals.should.equal(3);
            el.assists.should.equal(0);
            break;
        }
      });
      found.should.be.true;
      done();
    });
  });
  afterEach(function(done) {
    var length = data.length;
    data.forEach(function(data) {
      app.Player
        .find({ name : data.name })
        .remove(function(err, doc) {
          if (--length === 0) done();
        });
    });
  });
});

after(function(done) {
  app.close();
  user.remove(done);
});
