const express = require('express');
const router = express.Router();
const SerialPort = require('../lib/serialport')
const dataParser = require('../lib/data-parser')

dataParser.listen()
  .on('data', data => {
    let coordinateData = []
    for (let obj of data.objs) {
      coordinateData.push([obj.x, obj.y, obj.z])
    }
    console.log(coordinateData)
    global.io.emit('data', coordinateData)
  })

router.get('/list', (req, res, ) => {
  res.render('index')
  SerialPort.list()
    .then(ports => {
      global.io.emit('ports', ports)
    })
    .catch(err => {
      console.log(err)
    })
})

router.post('/connect', (req, res) => {
  let port = null
  console.log(req.body.port)
  if (!req.body.port) {
    res.status(500)
  }
  try {
    (new SerialPort.SerialTraceClient(req.body.port)).listen()
      .on('data', data => {
        try {
          dataParser.parse(data)
        } catch (err) {
          console.log(err)
          return
        }
      })
      .on('status', (status, port) => {
        global.io.emit('status', status, port)
      })
    res.status(200)
  } catch (err) {
    console.log(err)
    res.status(500)
    //global.io.emit('status', 'ERROR', port)
  }
})

module.exports = router;
