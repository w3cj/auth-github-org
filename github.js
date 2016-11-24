const jwt = require('jsonwebtoken');
const passport = require('passport');
const express = require('express');

const GitHubStrategy = require('passport-github2').Strategy;

const {createUser} = require('./user');

function config(authConfig) {
  const router = express.Router();

  authConfig.clients.forEach(client => {
    passport.use(client.name, new GitHubStrategy(getGithubConfig(client.name), loginGithubUser));

    router.get(`/${client.name}/github`,(req, res, next) => {
      passport.authenticate(client.name, {
        scope: ['user:email', 'read:org']
      })(req, res, next);
    });

    router.get(`/${client.name}/github/callback`, getCallback(client.name, client.callback));
  });

  function getCallback(name, clientURL) {
    return (req, res, next) => {
      passport.authenticate(name, (err, user) => {
        if (err) {
          return res.redirect(`${clientURL}error/${err}`);
        }

        jwt.sign(user, authConfig.token_secret, {},
          (err, token) => {
            if (err) return next(err);
            res.cookie('x-auth-token', token);
            res.redirect(clientURL);
          });
      })(req, res, next);
    };
  }

  function getGithubConfig(client) {
    return {
      clientID: authConfig.client_id,
      clientSecret: authConfig.client_secret,
      callbackURL: `${authConfig.auth_URL}${client}/github/callback`
    };
  }

  function loginGithubUser(accessToken, refereshToken, profile, done) {
    authConfig
      .findUser(profile.id)
        .then(user => {
          if (!user) {
            createUser(authConfig, accessToken, profile)
              .then(user => {
                if (!user) return done('User not found. You must be a member of the allowed github organization(s).');
                return done(null, user);
              }).catch(err => {
                return done(err);
              });
          } else {
            return done(null, user);
          }
        }).catch(err => {
          return done(err);
        });
  }

  return router;
}

module.exports = config;
