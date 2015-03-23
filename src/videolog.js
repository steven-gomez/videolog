var floor = Math.floor;
var videoPrefix = "official_";
var vidDir = "/Volumes/External Intel SSD/Aardvark/aptima-video/screenVideo/";
var logDir = "/Volumes/External Intel SSD/Aardvark/aptima-video/example_logs/vcode_outputs/";

function clamp(a, min, max) {
  if (a < min) return min;
  if (a > max) return max;
  return a;
}

function loadClip(src, start, duration, action, playerId) {
  var bufferSecs = 1;
  var myPlayer = videojs(playerId);
  var bufferedStartSec = floor(parseInt(start)/1000) - bufferSecs;
  var bufferedEndSec = floor(parseInt(start)/1000) + bufferSecs;
  duration = parseInt(duration);
  
  // Set caption to action name, load video src
  $('#actionTitle').text(action);
  
  myPlayer.src(src);
  bufferedStartSec = clamp(bufferedStartSec, 0, myPlayer.duration());
  bufferedEndSec = clamp(bufferedEndSec, 0, myPlayer.duration());
  
  myPlayer.currentTime(bufferedStartSec);
  myPlayer.one('play', function() { pauseAfterClip(myPlayer, duration, bufferSecs); } );
}

function pauseAfterClip(myPlayer, duration, bufferSecs) {
  var clipLengthMs = duration + (2*1000*bufferSecs);
  console.log("Scheduling pause in: "+clipLengthMs/1000+" secs");
  myPlayer.setTimeout(function() { 
    console.log("Pausing");
    myPlayer.pause();
  }, clipLengthMs);
}

function loadVideolog(selection, playerId) {
  var myPlayer = videojs(playerId);
  
  // Set header to selection name, load video src
  var vidName = videoPrefix + selection + '.mp4';
  $('#selectionNameTitle').text("Video: " + vidName);
  var src = vidDir + vidName;
  myPlayer.src(src);
  
  // Parse log into UL of actions
  var logFile = logDir + selection + '.txt';

  $.get(logFile, function(data) {
    var lines = data.split('\n');
    var line = null;
    var parts = null;
    var start = null;
    var duration = null;
    var action = null;
    var newli = null;
    
    $('#actionlist ul').html('');
    
    for (var i = 0; i < lines.length; i++) {
      line = lines[i].trim();
      if (line) {
        parts = line.split(',');
        start = parseInt(parts[0]);
        duration = parseInt(parts[1]);
        action = parts[2];

        newli = '<li><a onclick="loadClip(\''+
                src+'\',\''+
                start+'\',\''+
                duration+'\',\''+
                action+'\',\'' + 
                playerId+'\')">' +
                'Time: '+start+', ' + action+'</a></li>';
        
        //console.log(newli);
        $('#actionlist ul').append(newli);
      }
    }
  }, 'text');
}