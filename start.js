/*
  Advanced Explorer Node server
	(c) 2012-2017 Denis Sureau
	Free, open source under the GPL 3 License.
*/

const http = require("http"),
    path = require("path"),
    url = require("url"),
    runner = require("child_process"),
    net = require('net'),
    fs = require("fs");

const {app, BrowserWindow, ipcMain } = require('electron')

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
  if(!exists) {
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

var mainEvent;
ipcMain.on('interface', (event, data) => {
   //console.log("Received: " + data) 
   mainEvent = event;
   var jo = JSON.parse(data);
   jo.event = event;
   explorer.shell(jo);
})

// Create a TCP server to communicate with native script

var nativeServer = net.createServer(function(ncom) { 
    ncom.setEncoding("utf8");
    ncom.on("error", function(err) {
        console.log("TCP error: " + err.stack);
    });    
    ncom.on('data', function(data) { 
        mainEvent.sender.send("interface", data);   // send data
    });
    ncom.on('end',  function() {  
    });
});

nativeServer.listen(1031, '127.0.0.1');

// Electron part

let win = explorer.win;

console.log("Starting Electron...")

function createWindow () {
    win = new BrowserWindow({width:1060, height: 650, "show":false,
        "webPreferences" : {
       "nodeIntegration":true,
       "webSecurity": false
        }   
    });
    //win.webContents.openDevTools()
	win.setMenu(null)

    explorer.setRoot(__dirname);
    console.log("Working directory : " + __dirname)

    // And load the HTML page
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'aexplorer.html'),
        protocol: 'File',
        slashes: true
    }))

    win.show()

    win.on('closed', () => {
        win = null
        explorer.closeWindow()
    })
}

process.on('uncaughtException', function (error) { })

app.on('ready', createWindow)
app.on('quit', function () {
    // something to do before to quit
});
app.on('window-all-closed', () => {
  console.log("Windows closed, exit.")
  if (process.platform !== 'darwin') app.quit()
  process.exit(1)
})
app.on('activate', () => {
  if (win === null)  createWindow()
})
