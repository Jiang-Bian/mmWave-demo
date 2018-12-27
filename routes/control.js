const express = require('express');
const router = express.Router();
const SerialPort = require('../lib/serialport')
const dataParser = require('../lib/data-parser')

let serialPort = null

dataParser.listen()
  .on('data', data => {
    //console.log(data)
    let coordinateData = []
    for (let obj of data.objs) {
      coordinateData.push([
        obj.x / Math.pow(2, data.xyzQFormat),
        obj.y / Math.pow(2, data.xyzQFormat),
        obj.z / Math.pow(2, data.xyzQFormat)
      ])
    }
    //console.log(coordinateData)
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
  console.log('port:', req.body.port)
  if (!req.body.port) {
    res.sendStatus(500).json({ port: req.body.port })
    return
  }

  try {
    serialPort = new SerialPort.SerialTraceClient(req.body.port)
    serialPort.listen()
      .on('data', data => {
        try {
          dataParser.parse(data)
        } catch (err) {
          console.log(err)
          return
        }
      })
      .on('sendStatus', (sendStatus, port) => {
        global.io.emit('sendStatus', sendStatus, port)
      })
    res.sendStatus(200)
  } catch (err) {
    console.log(err)
    res.sendStatus(500).json({ err })
    global.io.emit('sendStatus', 'ERROR', port)
  }
})

router.post('/disconnect', (req, res) => {
  console.log('port:', req.body.port)
  if (!serialPort) {
    res.sendStatus(500).json({ err: 'not yet startted' })
    return
  }

  try {
    serialPort.disconnect()
    serialPort = null
    res.sendStatus(200)
  } catch (err) {
    console.log(err)
    res.sendStatus(500).json({ err })
    global.io.emit('sendStatus', 'ERROR', port)
  }
})

module.exports = router;
