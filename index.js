var request = require('request')
var exec = require('child_process').exec
var config = require('nconf').env().file({
  file: 'config.json'
})
var lastCommand = 'OFF'
var camProc

var commands = {
  OFF: function () {
    camProc && camProc.kill('SIGKILL')
    camProc = null
  },
  ON: function () {
    if (!camProc) {
      console.log('Streaming started')
      camProc = exec(streamCommand(), function (err, stdout, stderr) {
        console.log('Streaming stopped')
        console.log(stdout)
        console.log(stderr)
      })
    }
  }
}

checkStatus()

function checkStatus () {
  request(config.get('SECAM_STATUS_URL'), function (err, response, body) {
    if (response.statusCode === 200) {
      var command = JSON.parse(body)['COMMAND']
      if (command !== lastCommand && commands[command]) {
        console.log('Received command ' + command)
        commands[command]()
        lastCommand = command
      }
    }
    setTimeout(checkStatus, 5000)
  })
}

function streamCommand() {
  return [
    'raspivid',
    '-n',
    '-o -',
    '-t 0',
    '-vf',
    '-hf',
    '-fps 30',
    '-b 6000000',
    '|',
    'ffmpeg',
    '-re',
    '-ar 44100',
    '-ac 2',
    '-acodec pcm_s16le',
    '-f s16le',
    '-ac 2',
    '-i /dev/zero',
    '-f h264',
    '-i -',
    '-vcodec copy',
    '-acodec aac',
    '-ab 128k',
    '-g 50',
    '-strict experimental',
    '-f flv',
    'rtmp://a.rtmp.youtube.com/live2/' + config.get('YOUTUBE_KEY')
  ].join(' ')
}
