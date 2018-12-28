const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const debug = require('debug')('mmwave-demo:server')
const spawn = require('child_process').spawn
const fs = require('fs')

const indexRouter = require('./routes/index');
const controlRouter = require('./routes/control')

let app = express()
let proc = null

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs');

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)
app.use('/control', controlRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

/**
 * Get port from environment and store in Express.
 */
app.set('port', normalizePort(process.env.PORT || '3000'))

/**
 * Create HTTP server.
 */
const server = require('http').createServer(app)
global.io = require('socket.io')(server)

let sockets = {}
global.io
  .on('connect', socket => {
    sockets[socket.id] = socket
    console.log("Total clients connected : ", Object.keys(sockets).length)

    socket
      .on('disconnect', () => {
        delete sockets[socket.id]
        if (Object.keys(sockets).length == 0) {
          app.set('watchingFile', false)
          fs.unwatchFile('./public/image_stream.jpg')
          if (proc) proc.kill()
        }
      })
      .on('start-stream', () => {
        startStreaming()
      })

    const SerialPort = require('./lib/serialport')
    SerialPort.list()
      .then(ports => {
        socket.emit('ports', ports)
      })
      .catch(err => {
        console.log(err)
      })
  })

function stopStreaming() {
  if (Object.keys(sockets).length == 0) {
    app.set('watchingFile', false);
    if (proc) proc.kill();
    fs.unwatchFile('./public/image_stream.jpg');
  }
}

function startStreaming() {
  if (app.get('watchingFile')) {
    io.sockets.emit('liveStream', 'image_stream.jpg?_t=' + (Math.random() * 100000));
    return;
  }

  var args = ["-w", "480", "-h", "360", "-o", "./public/image_stream.jpg","-e","jpg","-ex","auto","-br","85", "-co","80", "-t", "999999999", "-tl", "10"];
  proc = spawn('raspistill', args);
  console.log('Watching for changes...')

  app.set('watchingFile', true);
  fs.watchFile('./public/image_stream.jpg', function (current, previous) {
    global.io.emit('liveStream', 'image_stream.jpg?_t=' + (Math.random() * 100000));
  })
}

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(80)
server.on('error', onError)
server.on('listening', onListening)

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  var addr = server.address()
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind)
}

