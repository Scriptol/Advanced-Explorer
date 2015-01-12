/*
  Advanced Explorer Node server
	(c) 2012-2014 Denis Sureau
	Free, open source under the GPL 3 License.
*/

var http = require("http"),
    path = require("path"),
    url = require("url"),
    runner = require("child_process"),
    net = require('net'),
    fs = require("fs");

var WebSocketServer = require("ws").Server;
var websocket = new WebSocketServer( { port: 1030 } );

var explorer = require("explorer");


// Main server

function sendError(errCode, errString, response)
{
    response.writeHead(errCode, {"Content-Type": "text/plain"});
    response.write(errString + "\n");
    response.end();
    return;
}

function sendFile(err, file, response, ext)
{
	if(err) return sendError(500, err, response);
    var ctype = 'text/html';
	switch(ext)
	{
		case '.js': ctype = 'text/javascript'; break;
		case '.css':ctype = 'text/css'; break;
		case '.jpg':ctype = 'image/jpeg'; break;
		case '.jpeg':ctype = 'image/jpeg'; break;
		case '.png':ctype = 'image/png'; break;
		case '.gif':ctype = 'image/gif'; break;
    }
	response.writeHead(200, {'Content-Type':ctype});
	response.write(file, "binary");
	response.end();
}

function getFile(exists, response, localpath)
{
	if(!exists) return sendError(404, '404 Not Found', response);
	var ext = path.extname(localpath);
	//console.log("Reading " + localpath);
	fs.readFile(localpath, "binary",
    	function(err, file){ sendFile(err, file, response, ext);});
}

function getFilename(request, response)
{
    var urlpath = url.parse(request.url).pathname; // following domain or IP and port
    var localpath = path.join(process.cwd(), urlpath); // if we are at root
    fs.exists(localpath, function(result) { getFile(result, response, localpath)});
}

function nativeComm(ncom)
{
    console.log('TCP connection: ' + ncom.remoteAddress +':'+ ncom.remotePort);
    ncom.setEncoding("utf8");

    ncom.on('data',
      function(data)
      {
        //listener.sockets.emit('notification', data);
      }
    );
    ncom.on('end',
      function() {
        console.log('Native connection closed.');
      }
    );
}

function runScript(exists, file, param) // Run a local script a the Web interface request
{
  if(!exists)
  {
    console.log("File not found");
    return false;
  }
  console.log("Running...");
  var r = runner.exec(file + " " + param,
    function(err, stdout, stderr) { console.log(stdout);}
  );
  console.log(file + " launched by the server...");
  r.on('exit', function (code) {
    console.log('Local script terminated.');
  });
}

function webComm(websocket)
{
  console.log("Browser connected online...")
  websocket.on( 'message' , function (e)
  { 
      var jo = JSON.parse(e);
      var data = jo.data;     
      //console.log("MESSAGE " + JSON.stringify(data)) 
      if(jo.type== "answer") 
      {
        switch(data.command)
         {
            case "copyover":
              explorer.shell(websocket, fs, data);
              break;
            case "copyzip":
              explorer.shell(websocket, fs, data);
              break;
            default:
              break;  
         }     
        return;
      }

      if(jo.type == "interface") 
      {
        //console.log("type", jo.type);
        //console.log("data", jo.data);
  
		    var app = data.app;
		    var params = data.params;
            switch(app)
	        {   
		    	case 'explorer':
			 	    console.log(" ");
				    explorer.shell(websocket, fs, params);
				    break;
                default:
				    var filename = params.path;
				    fs.exists(filename, function(result) { 
				    runScript(result, app, filename + " " + params)});
            }   
		  }
      else
            console.log("Unknow message type from browser...");
  });
  
  websocket.on('close', function() { console.log("Browser gone.") });
 
}


function loadBrowser(filename)
{
	var param="http://localhost:1032/" + filename;
	var browserName = explorer.config.browser;
    var browser = explorer.config[browserName];
    if(browserName=='')
    {
      browser = explorer.config.chrome;
      browserName='Chrome';
    }
    
    console.log('Loading browser: '+ browser);

	fs.exists(browser, function(result) {
		if(!result) { console.log("File not found " + browser); return 0; }
		var command = browser +  " " + param;
		console.log("Running " + command);
		runner.exec(command, function(err, stdout, stderr) { 
        console.log("Terminated. "+ stderr); 
    });
	});

}

var tiloidOS = explorer.loadIni("aexplorer.ini");
var server = http.createServer(getFilename); // Create a server to display the interface
server.listen(1032);
console.log("Server available...");
loadBrowser('AExplorer/aexplorer.html');
console.log("Browser loaded. Port 1030 ready.");

// Create a TCP server to communicate with native script
var nativeserver = net.createServer(function(n) { nativeComm(n);});
nativeserver.listen(1031, '127.0.0.1');
console.log('TCP local server active on port 1031.');

// Create a websocket connection
console.log("WebSocket started on port 1030.");
websocket.on('connection', function (w) { webComm(w);} );