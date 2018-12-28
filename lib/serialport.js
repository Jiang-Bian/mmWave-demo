const Event = require('events')
const SerialPort = require('serialport')
const { Readline } = SerialPort.parsers
const fs = require('fs-extra')

exports.list = SerialPort.list

exports.SerialTraceClient = class {
  constructor(port) {
    if (!port || typeof port !== 'string') {
      console.log(port, typeof port)
      throw new TypeError('unregnized port: ' + port)
    }

    this.emitter = new Event()
    this.port = port
    this.connected = false

    //this.connect()

    this.monitorInterval = setInterval(() => {
      const isUSB = fs.existsSync(this.port)
      if (!isUSB && !this.connected) {
        this.emitter.emit('status', 'no device', this.port)
      } else if (!isUSB && this.connected) {
        this.emitter.emit('status', 'disconnected', this.port)
        this.connected = false
      } else if (isUSB && !this.connected) {
        this.connect()
      }
    }, 1000)
    //   const isUSB = fs.existsSync(this.port)
    //   if (!isUSB && !this.connected) {
    //     this.emitter.emit('status', 'no device', this.port)
    //   } else if (!isUSB && this.connected) {
    //     this.emitter.emit('status', 'disconnected', this.port)
    //     this.connected = false
    //   } else if (isUSB && !this.connected) {
    //     this.connect()
    //   }
    // }, 1000)
  }

  listen() {
    return this.emitter
  }

  connect() {
    this.serial = new SerialPort(this.port, { baudRate: 921600, autoOpen: true })
      .on('open', () => {
        console.log(this.port, 'opended!')
        this.emitter.emit('status', 'connected', this.port)
      })
      .on('close', () => {
        console.log(this.port, 'closed!')
        this.emitter.emit('status', 'disconnected', this.port)
        this.connected = false
      })
      .on('error', err => {
        console.log(err)
        //this.emitter.emit('status', 'ERROR', this.port)
        //this.disconnect()
      })
      .on('data', data => {
        //console.log(data.length, data.toString('hex').match(/../g).join(' '))
        this.emitter.emit('data', data)
      })

    return true
  }

  disconnect() {
    if (this.connected) {
      clearInterval(this.monitorInterval)
      this.serial.close()
      this.serial.removeAllListeners()
      this.emitter.emit('status', 'disconnected', this.port)
    }
  }
}
