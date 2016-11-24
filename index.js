'use strict';

const jwt = require('jsonwebtoken');

function getTokenFromBearer(header) {
  const tokenSplit = header.split(' ');
  return tokenSplit.length > 0 ? tokenSplit[1] : tokenSplit[0];
}

function getTokenFromRequest(req) {
  const bearer = req.get('Authorization');
  if (bearer) {
    return getTokenFromBearer(bearer);
  } else return false;
}

function verifyJWT(token) {
  return new Promise((resolve) => {
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
      if (err) return resolve();
      resolve(decoded);
    });
  });
}

function getUserFromBearer(bearer) {
  const token = getTokenFromBearer(bearer);

  if (token) {
    return verifyJWT(token)
      .then(user => {
        return user;
      });
  } else {
    return Promise.resolve();
  }
}

function checkTokenSetUser(req, res, next) {
  const token = getTokenFromRequest(req);

  // console.log('Auth', req.get('Authorization')); Uncommenting this seems to fix the seemingly random 401 error...

  if (token) {
    verifyJWT(token)
      .then(user => {
        req.user = user;
        next();
      });
  } else {
    next();
  }
}

function ensureLoggedIn(req, res, next) {
  if(req.user && req.user._id) next();
  else {
    res.status(401);
    res.json({message: 'UnAuthorized'});
  }
}

module.exports = {
  ensureLoggedIn,
  verifyJWT,
  checkTokenSetUser,
  config: require('./github'),
  getUserFromBearer
};
