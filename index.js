var http = require('http')
var exec = require('child_process').exec
var config = require('nconf').env().file({
  file: 'config.json'
})
var statusUrl = 'http://' + config.get('SECAM_HOST') + '/status'
var lastStatus = 204
var camProc

checkStatus()

function checkStatus () {
  http.request(statusUrl, function (res) {
    if (res.statusCode !== lastStatus) {
      flipSwitch()
      lastStatus = res.statusCode
    } else {
      setTimeout(checkStatus, 2000)
    }
  })
}

function flipSwitch () {
  if (lastStatus === 204) {
    camProc = exec(command(), function () {
      setTimeout(checkStatus, 2000)
    })
  } else {
    camProc.kill()
  }
}

function command() {
  return [
    'raspivid',
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
    '/dev/zero',
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
