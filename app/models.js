// Models.js - MongoDB models
// ==========================
var crypto = require('crypto')
  , User, Player;

function defineModels(db, mongoose, fn) {
  var Schema = mongoose.Schema;

  // Model: User
  // -----------
  User = new Schema({
      name: { type: String, required: true, index: { unique: true } }
    , hashed_password: String
    , salt: String
  });

  // Store passwords hashed in the database.
  User.virtual('password')
    .set(function(password) {
      this._password = password;
      this.salt = this.makeSalt();
      this.hashed_password = this.encryptPassword(password);
    })
    .get(function() { return this._password; });

  // Check if the plaintext password passed matches with the encrypted one in
  // the model.
  User.method('authenticate', function(plaintext) {
    return this.encryptPassword(plaintext) === this.hashed_password;
  });

  // Create a random salt
  User.method('makeSalt', function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  });

  // Encrypt a password
  User.method('encryptPassword', function(password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
  });

  // Before saving, make sure a password exists.
  User.pre('save', function(next) {
    if (!(this.password && this.password.length)) {
      next(new Error('Invalid password'));
    } else {
      next();
    }
  });


  // Model: Player
  // -------------
  Player = new Schema({
      name: { type: String, required: true, index: { unique: true } }
    , games: { type: Number, default: 0 }
    , goals: { type: Number, default: 0 }
    , assists: { type: Number, default: 0 }
  });

  // Initialize the models.
  db.model('User', User);
  db.model('Player', Player);

  if (fn) fn();
}

exports.defineModels = defineModels;
