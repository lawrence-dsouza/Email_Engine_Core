const jwt = require('jsonwebtoken');

module.exports.decode = (token) => jwt.decode(token);