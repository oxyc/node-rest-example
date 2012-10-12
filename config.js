var fs = require('fs');
module.exports = {
    mongoose: {
      auth: 'mongodb://oxy:oxy@innebandy.oxy.minas-tirith.genero.fi:27017/innebandy'
    // Uncomment to enable SSL.
    // , options: {
    //     server: { ssl: 'ssl' }
    // }
  }
  // Hard coded users which have CRUD access
  , http_auth: [{ username: 'oxy', password: 'oxy' }]
  , http_server: {
      url: 'https://innebandy.oxy.minas-tirith.genero.fi:8000'
  }
  // Server configurations
  , restify: {
      certificate: fs.readFileSync('./cert/ssl/newcerts/innebandy.oxy.minas-tirith.genero.fi.crt')
    , key: fs.readFileSync('./cert/server.key')
    , ca: fs.readFileSync('./cert/ssl/certs/cacert.pem')
    , requestCert: true
    , rejectUnauthorized: true
  }
};
