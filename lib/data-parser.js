const Parser = require('binary-parser').Parser
const Event = require('events')

const headerLength = 40
const delimiter = Buffer.from([02, 01, 04, 03, 06, 05, 08, 07])

const emitter = new Event()
exports.listen = function () {
    return emitter;
}

// exports.parse = function (message) {
//     gBuffer = Buffer.concat([gBuffer, message])
//     if (gBuffer.length < headerLength) return

//     let index = gBuffer.indexOf(delimiter)
//     gBuffer = gBuffer.slice(index)
//     if (gBuffer.length < 16) return

//     let packetLength = gBuffer.readUInt8(12)
//     //console.log(gBuffer.length, gBuffer)
//     //console.log('packetLength', packetLength)
//     if (gBuffer.length < packetLength) return

//     let data = parse(gBuffer.slice(0, packetLength))
//     emitter.emit('data', data)

//     gBuffer = gBuffer.slice(packetLength)
// }

let gBuffer = Buffer.alloc(0)
exports.parse = function (message) {
    //console.log(message.length, message.toString('hex').match(/../g).join(' '))
    gBuffer = Buffer.concat([gBuffer, message])
    while (gBuffer.length > headerLength) {

        let index = gBuffer.indexOf(delimiter)
        gBuffer = gBuffer.slice(index)
        if (gBuffer.length < headerLength) return

        //console.log(gBuffer.length, gBuffer)
        let packetLength = gBuffer.readUInt8(12)

        if (gBuffer.length >= packetLength + 16) {
            // check the delimiter bytes of next frame
            if (gBuffer.indexOf(delimiter, 16) == -1) {
                gBuffer = gBuffer.slice(16)
                continue
            } else {
                emitter.emit('data', parse(gBuffer.slice(0, packetLength)))
                gBuffer = gBuffer.slice(packetLength)
            }
        } else {
            // no enough bytes to decide if this is a valid frame
            return
        }
    }
}

function parse(buffer) {
    return new Parser()
        .endianess('little')
        //MmwDemo_output_message_header
        .array('magicWord', { length: 4, type: 'uint16le' })//, assert: [0x12, 0x34, 0x56, 0x78] })
        .uint32('version')
        .uint32('totalPacketLen')
        .uint32('platform')
        .uint32('frameNumber')
        .uint32('timeCpuCycles')
        .uint32('numDetectedObj')
        .uint32('numTLVs')
        .uint32('subFrameNumber')
        .skip(8)

        .uint32('type')
        .uint32('length')
        .uint16('numDetectedObj2')
        .uint16('xyzQFormat')

        //MmwDemo_detectedObj
        .array('objs', {
            length: 'numDetectedObj',
            type: new Parser()
                .endianess('little')
                .uint16('rangeIdx')
                .int16('dopplerIdx')
                .uint16('peakVal')
                .int16('x')
                .int16('y')
                .int16('z'),
                // formatter:function(value){
                //     value.x = value.x/Math.pow(2, this.xyzQFormat)
                //     value.y = value.y/Math.pow(2, this.xyzQFormat)
                //     value.z = value.z/Math.pow(2, this.xyzQFormat)
                //     return value
                // }

        })
        //     }
        // })
        .parse(buffer)
}

//MmwDemo_output_message structure:
// {
//     MmwDemo_output_message_header    message_header; //Message header
//     MmwDemo_object_message           object_message; //Target Data
// }

//struct MmwDemo_output_message_header
// {
//     uint16_t    magicWord[4];   //{0x0102,0x0304,0x0506,0x0708}
//     uint32_t    version;        //Version
//     uint32_t    totalPacketLen; //Length
//     uint32_t    platform;       //Platform
//     uint32_t    frameNumber;    //Frame number
//     uint32_t    timeCpuCycles;  //Cpu cycle
//     uint32_t    numDetectedObj  //Number of targets
//     uint32_t    numTLVs;        //TLV = 1
//     uint32_t    subFrameNumber  //Subframe number
// }

//struct MmwDemo_ object _message
// {
//     uint32_t            type;          //Event type
//     uint32_t            length;        //Event length
//     uint16_t            numDetetedObj; //Number of targets
//     uint16_t            xyzQFormat;    //Q number
//     MmwDemo_detectedObj Obj             //Target structure
// }

// struct MmwDemo_detectedObj
// {
//     uint16_t rangeIdx;  //Range index
//     int16_t dopplerIdx; //Doppler index
//     uint16_t peakVal;   //Peak value
//     int16_t x;          //Target x
//     int16_t y;          //Target y
//     int16_t z;          //Target z
// }