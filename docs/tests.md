# TOC
   - [mongodb](#mongodb)
   - [User](#user)
   - [Authentication](#authentication)
   - [Player](#player)
   - [statistics](#statistics)
<a name="" />
 
<a name="mongodb" />
# mongodb
should connect.

```js
app.db.readyState.should.equal(1);
```

<a name="user" />
# User
should create valid user.

```js
user = new app.User({ name: 'oxy', password: 'test' });
user.save(function(err, doc) {
  if (err) return done(err);
  user.name.should.equal('oxy');
  user.authenticate('test').should.be.true;
  done();
});
```

should delete user.

```js
user.remove(function (err, doc) {
  if (err) return done(err);
  done();
});
```

list users.

```js
app.User.find().exec(function(err, doc) {
  doc.should.be.a('object');
  done();
});
```

<a name="authentication" />
# Authentication
should send 403 with wrong authorization.

```js
client.basicAuth(username, 'wrongPass');
client.get('/players', function(err, req, res) {
  if (res.statusCode === 403) done();
});
```

should validate authorization.

```js
client.basicAuth(username, password);
client.get('/players', function(err, req, res) {
  if (err) return done(err);
  done();
});
```

should validate hard coded users.

```js
var hardcoded = require('../config.js').http_auth[0];
client.basicAuth(hardcoded.username, hardcoded.password);
client.get('/players', function(err, req, res) {
  if (err) return done(err);
  done();
});
```

<a name="player" />
# Player
should be able to create player.

```js
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
```

should be able to list players.

```js
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
```

should be able to get single player.

```js
client.get('/players/RandomPlayer', function(err, req, res) {
  if (err) return done(err);
  res.should.have.status(200);
  res.should.be.json;
  JSON.parse(res.body)
    .goals.should.equal(0);
  done();
});
```

should be able to update player.

```js
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
```

should be able to delete player.

```js
client.del('/players/RandomPlayer', function(err, req, res) {
  if (err && err.statusCode !== 410) return done(err);
  res.should.have.status(410);
  res.body.should.be.empty;
  done();
});
```

should accept uri encoded players.

```js
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
```

<a name="statistics" />
# statistics
should be able to get statistics.

```js
client.get('/statistics', function(err, req, res) {
  if (err) return done(err);
  res.should.have.status(200);
  done();
});
```

should be able to update statistics.

```js
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
```

