/**
 * Temporary DB Wrapper for storing and managing users.
 *
 * @ Aaron Baw 2019
 */

var users = require(__dirname+'/db.json');
const fs = require('fs');

module.exports = {
  getUserByUsername: async (username) => {
    return users[username];
  },
  createUser: ({username, password}) => new Promise((resolve, reject) => {

    if (users[username]) return reject('Username exists.');

    users[username] = {
      username, password
    };

    // Update the DB file.
    fs.writeFile(__dirname+'/db.json',JSON.stringify(users, null, 2), (err) => {

      if (err) return reject(err);
      console.log(`DB | Creater user`, users[username]);

      return resolve(users[username]);
    });

  })
}
