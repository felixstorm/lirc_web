//
// lirc_web
// v0.0.4
// Alex Bain <alex@alexba.in>
//

// Set this to true if you'd like to emulate a list of remotes for development
var DEVELOPER_MODE = false;

//
// Requirements
//
var express = require('express'),
    lirc_node = require('lirc_node'),
    consolidate = require('consolidate'),
    swig = require('swig');

var app = module.exports = express();


//
// Precompile templates
//
var JST = {
    index: swig.compileFile(__dirname + '/templates/index.swig')
};


//
// lic_node initialization
//
if (!DEVELOPER_MODE) {
    lirc_node.init(function() {
        // Add reboot commands
        for (var key in lirc_node.remotes) {
            lirc_node.remotes[key].push({ command: 'reboot', display: 'Reboot RPI', exec: 'sudo reboot'});
        }
    });
}

//
// Overwrite the remotes to be a default set if DEVELOPER_MODE is true
//
if (DEVELOPER_MODE) {
    lirc_node.remotes = {
        'Yamaha': [
            'power',
            'vaux',
            'hdmi1',
            'volup',
            'voldown'
        ],
        'SonyTV': [
            'power',
            'volumeup',
            'volumedown',
            'channelup',
            'channeldown'
        ],
        Microsoft_Xbox360: [
            'OpenClose',
            'XboxFancyButton',
            'OnOff',
            'Stop',
            'Pause',
            'Rewind',
            'FastForward',
            'Prev',
            'Next',
            'Play',
            'Display',
            'Title',
            'DVD_Menu',
            'Back',
            'Info',
            'UpArrow',
            'LeftArrow',
            'RightArrow',
            'DownArrow',
            'OK',
            'Y',
            'X',
            'A',
            'B',
        ]
    };
}


//
// App configuration
//
app.engine('.html', consolidate.swig);
app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');

    app.use(express.compress());
    app.use('/css', express.static(__dirname + '/css'));
    app.use('/images', express.static(__dirname + '/images'));
    app.use('/js', express.static(__dirname + '/js'));
});


//
// Routes
//


// Web UI endpoint
app.get('/', function(req, res) {
    console.log("Viewed index");
    res.send(JST['index'].render({
        remotes: lirc_node.remotes
    }));
});


// API endpoint
app.post('/remotes/:remote/:command', function(req, res) {
    console.log("Send Request: " + req.params.command + " to " + req.params.remote);
    var remoteItem = lirc_node.remotes[req.params.remote].filter(function(item) { return (item.command || item) == req.params.command; });
    if (remoteItem.length) {
        remoteItem = remoteItem[0];
		if (remoteItem.exec) {
			require('child_process').exec(remoteItem.exec);
		} else {
			lirc_node.irsend.send_once(req.params.remote, remoteItem.command || remoteItem);
		}
        res.setHeader('Cache-Control', 'no-cache');
        res.send(200);
	} else {
        res.setHeader('Cache-Control', 'no-cache');
        res.send(404);
	}
});


// Listen on port 80
app.listen(80);
console.log("Open Source Universal Remote UI + API has started on port 80.");
