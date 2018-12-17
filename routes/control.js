var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/list', function (req, res, next) {
  const SerialPort = require('../lib/serialport')
  SerialPort.list()
    .then(ports => {
      global.io.emit('ports', ports)
    })
    .catch(err => {
      console.log(err)
    })

  res.render('index', { title: 'Express' });
});

module.exports = router;
