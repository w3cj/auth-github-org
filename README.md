# Auth Github Org

Add github login to your express app restricted to specific github organization(s). Powered by `passport` and `passport-github2`.

## Configuration

Configuration files are node modules that export a configuration object.

Put the following in a file such as `auth-github.config.js`

```js
const {users} = require('./db');

require('dotenv').load();

module.exports = {
  auth_URL: process.env.AUTH_URL, // e.g. http://localhost:3000/auth/
  client_id: process.env.GITHUB_CLIENT_ID,
  client_secret: process.env.GITHUB_CLIENT_SECRET,
  token_secret: process.env.TOKEN_SECRET,
  cookieOptions: {
    domain: process.env.COOKIE_DOMAIN
    httpOnly: true,
    secure: true
  },
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
  //   email: 'john.doe@email.com',
  //   github_id: 'abc123456'
  // }
  // Providing createUserFromProfile in the config is optional.
  // To create your own user object, provide a method that returns a custom user object given the github profile object. The object returned is what will be inserted into the database in the insertUser method.
  createUserFromProfile(profile) {}
};
```

## Usage in Express

```js
// Express code above

const protectedRoutes = require('./routes/protected');

const auth = require('auth-github-org');
const authConfig = require('./auth-github.config'); // load the configuration file created above

 // Check the Authorization Header for a token, if valid, set the token payload as req.user
app.use(auth.checkTokenSetUser);

// auth.config creates the following routes for each client in the config:
// /my-client-app/github
// /my-client-app/github/callback
app.use('/auth', auth.config(authConfig));

// auth.ensureLoggedIn will send a 401 status if the Authorization header is not valid
app.use('/protected-routes', auth.ensureLoggedIn, protectedRoutes);

// More express code below
```

## Client side usage

After a successful login, the client is redirected to the callback URL specified in the client config.

The redirect will contain the cookie `x-auth-token` with the value of the JWT token created for the login.

Subsequent requests should have this token in the Authorization header in the format:

```json
"Authorization": "Bearer 1234567890asdfghjkl"
```

### Login error

If an error occurs during login, the client will be redirected to the following URL:

`${clientURL}error/${err}`

Where err is the error message.
