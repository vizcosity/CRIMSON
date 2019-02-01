
// Loads template file.
function loadTemplate (name) {
  var contents = fs.readFileSync(path.join(__dirname, '..', 'templates', (name + '.ejs')), 'utf-8')
  var locals = Object.create(null)

  function render () {
    return ejs.render(contents, locals, {
      escape: util.inspect
    })
  }

  return {
    locals: locals,
    render: render
  }
}


// Creates npm project skeleton and moves files to appropriate target directory.
function createApplication (name, dir) {

  // Package
  var pkg = {
    name: name,
    version: '0.1.0',
    private: true,
    scripts: {
      start: 'node app.js'
    },
    dependencies: {
      "cookie-parser": "~1.4.3",
      "debug": "~2.6.9",
      "ejs": "~2.5.7",
      "express": "~4.16.0",
      "express-session": "^1.15.6",
      "http-errors": "~1.6.2",
      "morgan": "~1.9.0",
      "ejs": "^2.6.1",
      "passport": "^0.4.0",
      "passport-local": "^1.0.0"
    }
  }

  // JavaScript
  var app = loadTemplate('js/app.js')
  var www = loadTemplate('js/www')

  // App name
  www.locals.name = name

  // App modules
  app.locals.localModules = Object.create(null)
  app.locals.modules = Object.create(null)
  app.locals.mounts = []
  app.locals.uses = []

  // Request logger
  app.locals.modules.logger = 'morgan'
  app.locals.uses.push("logger('dev')")
  pkg.dependencies.morgan = '~1.9.0'

  // Body parsers
  app.locals.uses.push('express.json()')
  app.locals.uses.push('express.urlencoded({ extended: false })')

  // Cookie parser
  app.locals.modules.cookieParser = 'cookie-parser'
  app.locals.uses.push('cookieParser()')
  pkg.dependencies['cookie-parser'] = '~1.4.3'

  if (dir !== '.') {
    mkdir(dir, '.')
  }

  mkdir(dir, 'public')
  mkdir(dir, 'public/javascripts')
  mkdir(dir, 'public/images')
  mkdir(dir, 'public/stylesheets')

  // copy css templates
  switch (program.css) {
    case 'less':
      copyTemplateMulti('css', dir + '/public/stylesheets', '*.less')
      break
    case 'stylus':
      copyTemplateMulti('css', dir + '/public/stylesheets', '*.styl')
      break
    case 'compass':
      copyTemplateMulti('css', dir + '/public/stylesheets', '*.scss')
      break
    case 'sass':
      copyTemplateMulti('css', dir + '/public/stylesheets', '*.sass')
      break
    default:
      copyTemplateMulti('css', dir + '/public/stylesheets', '*.css')
      break
  }

  // copy route templates
  mkdir(dir, 'routes')
  copyTemplateMulti('js/routes', dir + '/routes', '*.js')

  if (program.view) {
    // Copy view templates
    mkdir(dir, 'views')
    pkg.dependencies['http-errors'] = '~1.6.2'
    switch (program.view) {
      case 'dust':
        copyTemplateMulti('views', dir + '/views', '*.dust')
        break
      case 'ejs':
        copyTemplateMulti('views', dir + '/views', '*.ejs')
        break
      case 'hbs':
        copyTemplateMulti('views', dir + '/views', '*.hbs')
        break
      case 'hjs':
        copyTemplateMulti('views', dir + '/views', '*.hjs')
        break
      case 'jade':
        copyTemplateMulti('views', dir + '/views', '*.jade')
        break
      case 'pug':
        copyTemplateMulti('views', dir + '/views', '*.pug')
        break
      case 'twig':
        copyTemplateMulti('views', dir + '/views', '*.twig')
        break
      case 'vash':
        copyTemplateMulti('views', dir + '/views', '*.vash')
        break
    }
  } else {
    // Copy extra public files
    copyTemplate('js/index.html', path.join(dir, 'public/index.html'))
  }

  // CSS Engine support
  switch (program.css) {
    case 'compass':
      app.locals.modules.compass = 'node-compass'
      app.locals.uses.push("compass({ mode: 'expanded' })")
      pkg.dependencies['node-compass'] = '0.2.3'
      break
    case 'less':
      app.locals.modules.lessMiddleware = 'less-middleware'
      app.locals.uses.push("lessMiddleware(path.join(__dirname, 'public'))")
      pkg.dependencies['less-middleware'] = '~2.2.1'
      break
    case 'sass':
      app.locals.modules.sassMiddleware = 'node-sass-middleware'
      app.locals.uses.push("sassMiddleware({\n  src: path.join(__dirname, 'public'),\n  dest: path.join(__dirname, 'public'),\n  indentedSyntax: true, // true = .sass and false = .scss\n  sourceMap: true\n})")
      pkg.dependencies['node-sass-middleware'] = '0.11.0'
      break
    case 'stylus':
      app.locals.modules.stylus = 'stylus'
      app.locals.uses.push("stylus.middleware(path.join(__dirname, 'public'))")
      pkg.dependencies['stylus'] = '0.54.5'
      break
  }

  // Index router mount
  app.locals.localModules.indexRouter = './routes/index'
  app.locals.mounts.push({ path: '/', code: 'indexRouter' })

  // User router mount
  app.locals.localModules.usersRouter = './routes/users'
  app.locals.mounts.push({ path: '/users', code: 'usersRouter' })

  // Template support
  switch (program.view) {
    case 'dust':
      app.locals.modules.adaro = 'adaro'
      app.locals.view = {
        engine: 'dust',
        render: 'adaro.dust()'
      }
      pkg.dependencies.adaro = '~1.0.4'
      break
    case 'ejs':
      app.locals.view = { engine: 'ejs' }
      pkg.dependencies.ejs = '~2.6.1'
      break
    case 'hbs':
      app.locals.view = { engine: 'hbs' }
      pkg.dependencies.hbs = '~4.0.1'
      break
    case 'hjs':
      app.locals.view = { engine: 'hjs' }
      pkg.dependencies.hjs = '~0.0.6'
      break
    case 'jade':
      app.locals.view = { engine: 'jade' }
      pkg.dependencies.jade = '~1.11.0'
      break
    case 'pug':
      app.locals.view = { engine: 'pug' }
      pkg.dependencies.pug = '2.0.0-beta11'
      break
    case 'twig':
      app.locals.view = { engine: 'twig' }
      pkg.dependencies.twig = '~0.10.3'
      break
    case 'vash':
      app.locals.view = { engine: 'vash' }
      pkg.dependencies.vash = '~0.12.4'
      break
    default:
      app.locals.view = false
      break
  }

  // Static files
  app.locals.uses.push("express.static(path.join(__dirname, 'public'))")

  if (program.git) {
    copyTemplate('js/gitignore', path.join(dir, '.gitignore'))
  }

  // sort dependencies like npm(1)
  pkg.dependencies = sortedObject(pkg.dependencies)

  // write files
  write(path.join(dir, 'app.js'), app.render())
  write(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
  mkdir(dir, 'bin')
  write(path.join(dir, 'bin/www'), www.render(), MODE_0755)

  var prompt = launchedFromCmd() ? '>' : '$'

  if (dir !== '.') {
    console.log()
    console.log('   change directory:')
    console.log('     %s cd %s', prompt, dir)
  }

  console.log()
  console.log('   install dependencies:')
  console.log('     %s npm install', prompt)
  console.log()
  console.log('   run the app:')

  if (launchedFromCmd()) {
    console.log('     %s SET DEBUG=%s:* & npm start', prompt, name)
  } else {
    console.log('     %s DEBUG=%s:* npm start', prompt, name)
  }

  console.log()
}
