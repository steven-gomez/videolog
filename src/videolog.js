var floor = Math.floor;
var videoPrefix = "official_";
var vidDir = "/Volumes/External Intel SSD/Aardvark/aptima-video/screenVideo/";
var logDir = "/Volumes/External Intel SSD/Aardvark/aptima-video/example_logs/vcode_outputs/";
var actionMappingFile = "/Volumes/External Intel SSD/Aardvark/aptima-video/action_mapping_3.txt";
var linksReturnToPlayer = true;

var indicatorClass = "glyphicon glyphicon-menu-right";

$('.log_item').click(function() {
  $('.log_item > .indicator-span').removeClass(indicatorClass);
  $(this).children('.indicator-span').addClass(indicatorClass);
});

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
  
  if (linksReturnToPlayer) {
    $('html, body').animate({
      scrollTop: $("#selectionTitle").offset().top-50
    }, 'slow'); 
  } 
}

function pauseAfterClip(myPlayer, duration, bufferSecs) {
  var clipLengthMs = duration + (2*1000*bufferSecs);
  console.log("Scheduling pause in: "+clipLengthMs/1000+" secs");
  myPlayer.setTimeout(function() { 
    console.log("Pausing");
    myPlayer.pause();
  }, clipLengthMs);
}

function getActionMap(actionMappingFile) {
  return $.get(actionMappingFile, parseMapString);
}

function parseMapString(mapdata) {
  // Fill action-mapping object
  var mapping = {};
  var maplines = mapdata.split('\n');
  var mapline = null;
  var mapparts = null;
  
  for (var i = 0; i < maplines.length; i++) {
    mapline = maplines[i].trim();

    if (mapline) {
      mapparts = mapline.split(',');
      var app_specific = mapparts[0];
      var abstract = mapparts[1];
      mapping[app_specific] = abstract;
      //console.log(abstract);
    }
  }
  return mapping;
}

function loadVideolog(selection, playerId) {
  var myPlayer = videojs(playerId);
  
  // Set header to selection name, load video src
  var vidName = videoPrefix + selection + '.mp4';
  $('#selectionTitle').text("Video: " + vidName);
  var src = vidDir + vidName;
  myPlayer.src(src);
  
  // Parse log into UL of actions
  var logFile = logDir + selection + '.txt';

  $.get(actionMappingFile, function(mapData) {
    var mapping = parseMapString(mapData);
    console.log(mapping);
    
    $.get(logFile, function(logData) {
      addLogFilters(mapping, logData, src, playerId);   
    }, 'text');
  });
}

function clearFilters() {
  $('#actionlist ul').html('');
  $('#filterlist ul').html('');
}

function getUniqueActions(lines) {
  var line = null;
  var parts = null;
  var actions = [];
  
  for (var i = 0; i < lines.length; i++) {
    line = lines[i].trim();
    if (line) {
      parts = line.split(',');
      actions.push(parts[2]);
    }
  }
  return getUniques(actions);
}

function getUniques(arr) {
  var uniques = d3.set(); // use d3 set data structure
  for (var i = 0; i < arr.length; i++) {
    uniques.add(arr[i]);
  }
  return uniques;
}

function addLogFilters(mapping, logData, src, playerId) {
  clearFilters();
  var loglines = logData.split('\n');
  var uniqueActions = getUniqueActions(loglines);
  var uniqueAbstractActions = d3.set();
  uniqueActions.forEach(function(x) {
    uniqueAbstractActions.add(mapping[x]);
  });
  
  // Make filter checkboxes
  uniqueAbstractActions.forEach(function(x) {
    //console.log("for each: " + x);
    var newli = '<li><label class="'+ x +'">' +
                '<input type="checkbox" class="filter-checkbox" id="' + x +
                '"> ' + x + '</label></li>';
    $('#filterlist ul').append(newli);
    
  });
  
  // Add change listener to add the filter checkboxes
  $(".filter-checkbox").change(function() {
    // Clear the action list, then repopulate with the filtered items
    $('#actionlist ul').html('');
    
    // Go through and add a li to the action list for each
    // log action that matches one of the checked types
    
    var checkedActionTypes = $(".filter-checkbox").map(function() {
      if (this.checked) return this.id;
    }).get();
    console.log(checkedActionTypes);
    
    var line = null;
    var parts = null;
    var start = null;
    var duration = null;
    var action = null;
    var newli = null;
    
    for (var i = 0; i < loglines.length; i++) {
      line = loglines[i].trim();
      if (line) {
        parts = line.split(',');
        start = parseInt(parts[0]);
        duration = parseInt(parts[1]);
        action = parts[2];
        
        // If this logged action is in the selected filter list,
        // append it to action list
        if (checkedActionTypes.indexOf(mapping[action]) > -1) {
          newli = '<li><a class="'+mapping[action]+'" onclick="loadClip(\''+
                  src+'\',\''+
                  start+'\',\''+
                  duration+'\',\''+
                  action+'\',\'' + 
                  playerId+'\')">' +
                  '<span class="timeLabel">Time: '+start+'</span> <strong>' + mapping[action]+'</strong> [' + action+']</a></li>';
      
          //console.log(newli);
          $('#actionlist ul').append(newli);
        }
      }
    }
  });
}