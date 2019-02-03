/**
 * Temporary DB Wrapper for storing and managing users.
 *
 * @ Aaron Baw 2019
 */

var users = require(__dirname+'/db.json');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Cryptography.
 *
 * Ref: https://ciphertrick.com/2016/01/18/salt-hash-passwords-using-nodejs-crypto/
 *
 */

// Generates a salt to hash user passwords with.
const generateSalt = (length) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

// Generates a sha512 hash with the password plaintext and generated salt.
const hashWithSalt = (password, iterations, salt) => new Promise((resolve, reject) => {
    return crypto.pbkdf2(password, salt, iterations, 512, 'sha512', (err, hashSaltedPassword) => {
      return resolve({hashSaltedPassword: hashSaltedPassword.toString('hex'), iterations});
    });
});

const preparePassword = async password => {
  var salt = generateSalt(12);
  var {hashSaltedPassword, iterations} = await hashWithSalt(password, 10000, salt);
  return {
    hash: hashSaltedPassword,
    iterations: iterations,
    salt: salt
  };
};

module.exports = {
  getUserByUsername: async (username) => {
    return users[username];
  },
  validateUserPassword: async (username, passwordAttempt) => {
    console.log(`DB | Validating`, username);
    if (!users[username]) return false;
    var passwordDetails = users[username].password;
    var {hashSaltedPassword, _} = await hashWithSalt(passwordAttempt, passwordDetails.iterations, passwordDetails.salt);
    return hashSaltedPassword === passwordDetails.hash;
  },
  createUser: ({username, password}) => new Promise((resolve, reject) => {

    console.log(`DB | Creating user`, username);

    if (users[username]) return reject('Username exists.');

    preparePassword(password).then(passwordDetails => {

      users[username] = {
        username, password: passwordDetails
      };

      // Update the DB file.
      fs.writeFile(__dirname+'/db.json',JSON.stringify(users, null, 2), (err) => {

        if (err) return reject(err);
        console.log(`DB | Creater user`, users[username]);

        return resolve(users[username]);
      });

    });

  })
}
