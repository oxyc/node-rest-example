/*global describe:true, before:true, after:true, it:true */
/*jshint es5:true*/
var app = require('../')
  , assert = require('should');

// before(function() {
//   app.listen(8000);
// });

describe('mongodb', function() {
  it ('should connect', function() {
    app.db.readyState.should.equal(1);
  });
});

describe('User', function() {
  var user;
  it('should create valid user', function(done) {
    user = new app.User({ name: 'oxy', password: 'test' });
    user.save(function(err, doc) {
      if (err) return done(err);
      user.name.should.equal('oxy');
      user.authenticate('test').should.be.true;
      done();
    });
  });
  it('should delete user', function(done) {
    user.remove(function (err, doc) {
      if (err) return done(err);
      done();
    });
  });
  it('list users', function(done) {
    app.User.find().exec(function(err, doc) {
      doc.should.be.a('object');
      done();
    });
  });
});

// after(function() {
//   app.close();
// });
