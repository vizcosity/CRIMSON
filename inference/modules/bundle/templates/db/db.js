/**
 * Temporary DB Wrapper for storing and managing users.
 *
 * @ Aaron Baw 2019
 */

var users = require(__dirname+'/db.json');
const fs = require('fs');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const { url, collectionName, dbName } = require('./config.json');

/**
 * DB Set up.
 */

var db = null;

const instantiateDB = () => new Promise((resolve, reject) => {

  if (db) return resolve();

  log(`Creating mongo client instance.`);

  // Connect to Mongo server.
  const client = new MongoClient(url);
  client.connect(err => {
   if (err) return log(err);

   log(`Successfully connected to mongo server.`);

   // Get instance of the speak freely db.
   db = client.db(dbName).collection(collectionName);

   log(`DB Instante assigned.`);

   return resolve();

 });

});



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

const getUserByUsername = username => new Promise((resolve, reject) => {
  instantiateDB().then(() => {
    db.find({username}).toArray((err, res) => err ? reject(err) : resolve(res[0]));
  });
});

module.exports = {
  getUserByUsername,
  validateUserPassword: async (username, passwordAttempt) => {
    if (!db) await instantiateDB();
    console.log(`DB | Validating`, username);
    var user = await getUserByUsername(username);
    // log(`User:`, user);
    if (!user) {
      // log(`No user ${username} present in DB.`);
      return;
    }
    var passwordDetails = user.password;
    var {hashSaltedPassword, _} = await hashWithSalt(passwordAttempt, passwordDetails.iterations, passwordDetails.salt);
    return hashSaltedPassword === passwordDetails.hash;
  },
  createUser: ({username, password}) => new Promise(async (resolve, reject) => {

    if (!db) await instantiateDB();

    log(`DB | Creating user`, username);

    if (await getUserByUsername(username)) return reject('Username exists.');

    preparePassword(password).then(passwordDetails => {;

      db.insertOne({
          username, password: passwordDetails
      }, (err, result) => err ? reject(err) : resolve(result.ops[0]));

    });

  })
}

function log(...msg){
  if (process.env.DEBUG) console.log(`DB |`,...msg);
}
