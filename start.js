/*
  Advanced Explorer Node server
	(c) 2012-2015 Denis Sureau
	Free, open source under the GPL 3 License.
*/

const http = require("http"),
    path = require("path"),
    url = require("url"),
    runner = require("child_process"),
    net = require('net'),
    fs = require("fs");

const {app, BrowserWindow } = require('electron')

const WebSocketServer = require("ws").Server;
const websocket = new WebSocketServer( { port: 1030 } );
const explorer = require("explorer");


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
	fs.readFile(localpath, "binary",
    	function(err, file){ sendFile(err, file, response, ext);});
}

function getFilename(request, response)
{
    var urlpath = url.parse(request.url).pathname; // following domain or IP and port
    var localpath = path.join(process.cwd(), urlpath); // if we are at root
    fs.exists(localpath, function(result) { getFile(result, response, localpath)});
}


function runScript(exists, file, param) // Run a local script at the Web interface request
{
  if(!exists)
  {
    console.log("File not found");
    return false;
  }

  console.log("Running...");
  
  var r = runner.exec(file, param, function(err, stdout, stderr) { 
      console.log(stderr);
    }
  );
  console.log(file + " launched by the server...");
  r.on('exit', function (code) {
    console.log('Local script terminated.');
  });  
  
}

function webComm(websocket)
{
  websocket.on('message', function (e)
  { 
      var jo = JSON.parse(e);
      var data = jo.data;     
      console.log("Server get WS request from browser: " + jo.type)
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
  
  websocket.on('close', function() { 
    console.log("Server: WebSocket connection closed by the browser.")
  });
}


explorer.loadIni("aexplorer.ini");
var server = http.createServer(getFilename); // Create a server to display the interface
server.listen(1032);
console.log("Server available, listen to 1032...");

var socket;

// Create a TCP server to communicate with native script
var nativeServer = net.createServer(function(ncom) { 

    console.log('Native connection activated: ' + ncom.remoteAddress +':'+ ncom.remotePort);
    ncom.setEncoding("utf8");

    ncom.on("error", function(err) {
      console.log("TCP error: " + err.stack);
    });    
    ncom.on('data', function(data) { 
        console.log("Script to browser: " + data);
        socket.send(data);
    });
    ncom.on('end',  function() {  
      console.log('Native connection closed.');  
    });

});

nativeServer.listen(1031, '127.0.0.1');

// Create a websocket connection
console.log("WebSocket started on port 1030.");
websocket.on('connection', function (w) { 
  socket = w;
  webComm(w);} 
);


// Electron part

let win

console.log("Starting Electron...")

function createWindow () {
  win = new BrowserWindow({width:960, height: 600, "show":false,
    "webPreferences" : {
       "nodeIntegration":false,
       "webSecurity": false
    }   
  });

	win.setMenu(null)

  process.resourcesPath = __dirname
  console.log("Working directory : " + process.resourcesPath)

  // And load the HTML page

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'aexplorer.html'),
    protocol: 'File',
    slashes: true
  }))

  win.show()
  
  //win.webContents.openDevTools()
  
  win.on('closed', () => {
    win = null
  })
  
}

// Avoid JS errors messages at exit
process.on('uncaughtException', function (error) { })

app.on('ready', createWindow)

app.on('quit', function () {
    // something to do before to quit
});

app.on('window-all-closed', () => {
  console.log("Windows closed, exit.")
  if (process.platform !== 'darwin') {
    app.quit()
  }
  process.exit(1)
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})
