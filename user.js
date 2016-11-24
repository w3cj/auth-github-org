const GitHubApi = require('github');
const github = new GitHubApi();

function createUserFromProfile(profile) {
  const names = profile.displayName ? profile.displayName.split(' ') : [profile.username];
  const first_name = names[0];
  const last_name = names.length > 1 ? names[names.length - 1] : '';
  const avatar_url = profile._json && profile._json.avatar_url ? profile._json.avatar_url : '';

  return {
    first_name,
    last_name,
    avatar_url,
    github_id: profile.id
  };
}

function createUser(authConfig, accessToken, profile) {
  return checkMemberships(authConfig.orgs, accessToken, profile.username)
    .then(() => {
      const user = authConfig.createUserFromProfile ?
                    authConfig.createUserFromProfile(profile) :
                    createUserFromProfile(profile);

      return authConfig
          .insertUser(user)
          .then((user) => {
            return user;
          });
    });
}

function reverse(promise) {
    return new Promise((resolve, reject) => promise.then(reject, resolve));
}

function promiseAny(promises) {
    return reverse(Promise.all(promises.map(reverse)));
}

function checkMemberships(orgs, accessToken, username) {
  github.authenticate({
    type: "oauth",
    token: accessToken
  });

  return promiseAny(orgs.map(org => {
    return checkMembership(username, org.name, org.team_id);
  }));
}

function checkMembership(username, org) {
  return new Promise((resolve, reject) => {
    github.orgs.checkMembership({
      org,
      username
    }, (err, result) => {
      if (result) {
        resolve();
      } else {
        reject(`You are not a member of the ${org} organization.`);
      }
    });
  });
}

module.exports = {createUser};
