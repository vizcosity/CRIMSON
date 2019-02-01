/**
 * Given a project directory, launches an express instance to serve it.
 * Checks if there is a compatible 'app.js' file to bootstrap off of, and if not
 * simply starts an instance automatically.
 *
 * @ Aaron Baw 2019
 */

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Initialize routes with DB & Passport instance.
const indexRouter = require('./routes/index')({db, passport});

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({secret: 'my secret'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', './views');
app.set('view engine', 'ejs');
app.set('port', 8002);

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/register', registrationRouter);


/**
* Start Express server.
*/
app.listen(app.get('port'), () => {
 console.log('App is running at http://localhost:%d in %s mode', app.get('port'), app.get('env'));
 console.log('  Press CTRL-C to stop\n');
});
