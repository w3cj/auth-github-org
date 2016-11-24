const {users} = require('./db');

require('dotenv').load();

module.exports = {
  auth_URL: process.env.AUTH_URL, // e.g. http://localhost:3000/auth/
  client_id: process.env.GITHUB_CLIENT_ID,
  client_secret: process.env.GITHUB_CLIENT_SECRET,
  token_secret: process.env.TOKEN_SECRET,
  clients: [{
    name: 'my-client-app',
    callback: 'http://localhost:8080/#/auth/callback/'
  }],
  // Restrict login to members of the following orgs:
  orgs: [{
    name: 'my-awesome-org'
  }, {
    name: 'super-awesome-coders'
  }],
  findUser(github_id) {
    // Should return a promise that returns a user object given a github_id
    // This example uses mongodb and monk, any DB/library will work as long as this method returns a valid user object
    return users
      .findOne({
        github_id
      });
  },
  insertUser(user) {
    // Should return a promise that inserts a user object and returns it
    // This example uses mongodb and monk, any DB/library will work as long as this method inserts and returns a valid user object
    return users
      .insert(user);
  },
  // The default implementation of createUserFromProfile passes the user to the insertUser method in the following format:
  // {
  //   first_name: 'John',
  //   last_name: 'Doe',
  //   avatar_url: 'http://fillmurray.com/200/200',
  //   github_id: 'abc123456'
  // }
  // Providing createUserFromProfile in the config is optional.
  // To create your own user object, provide a method that returns a custom user object given the github profile object. The object returned is what will be inserted into the database in the insertUser method.
  createUserFromProfile(profile) {}
};
