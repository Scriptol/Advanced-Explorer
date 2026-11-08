/*
  Advanced Explorer Node server
	(c) 2012-2026 Denis Sureau
	Free, open source under the GPL 3 License.
*/

const debug = false;

const http = require("http"),
      path = require("path"),
      url = require("url"),
      runner = require("child_process"),
      net = require('net'),
      fs = require("fs");
const { app, BrowserWindow, ipcMain } = require('electron/main');
const explorer = require("explorer");
require('@electron/remote/main').initialize();

// Main server

function sendError(errCode, errString, response) {
  response.writeHead(errCode, {"Content-Type": "text/plain"});
  response.write(errString + "\n");
  response.end();
  return;
}

function sendFile(err, file, response, ext) {
	if(err) return sendError(500, err, response);
  var ctype = 'text/html';
	switch(ext)	{
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

function getFile(response, localpath) {
	var ext = path.extname(localpath);
	fs.readFile(localpath, "binary", function(err, file) { 
    sendFile(err, file, response, ext);
  });
}

function getFilename(request, response) {
  var urlpath = url.parse(request.url).pathname; // following domain or IP and port
  var localpath = path.join(process.cwd(), urlpath); // if we are at root

  if( fs.existsSync(localpath) ) {
    getFile(response, localpath)
  } else {
    sendError(404, '404 Not Found', response);
  }
}


function buildBoxList(basePath) {
    let result = [];

    if (!fs.existsSync(basePath)) {
        console.log("Répertoire introuvable :", basePath);
        return result;
    }

    const dirs = fs.readdirSync(basePath);

    dirs.forEach(name => {
        const dirPath = path.join(basePath, name);
        const stat = fs.statSync(dirPath);
        if (!stat.isDirectory()) return;
        const files = fs.readdirSync(dirPath);
        const indexFile = files.find(f => /^index\./.test(f));
        if (!indexFile) return;

        result.push({
            name,
            path: `${path.basename(basePath)}/${name}/${indexFile}`
        });
    });
    return result;
}

function updateScripts() {
    const xscriptsPath = path.join(__dirname, "xscripts.js");

    const boxlPath = path.join(__dirname, "boxl");
    const boxrPath = path.join(__dirname, "boxr");

    let xscripts = {};
    xscripts.boxl = buildBoxList(boxlPath);
    xscripts.boxr = buildBoxList(boxrPath);

    const newContent = "var xscripts = " + JSON.stringify(xscripts, null, 2) + ";";
    fs.writeFileSync(xscriptsPath, newContent);
}



var mainEvent;
ipcMain.handle('interface', (event, data) => {
  mainEvent = event;
  let jo = JSON.parse(data);

  if (jo.type === "ESCAPE") {
    explorer.abortRequested = true;
    console.log("Escape pressed → abort requested");
    return { success: false, aborted: true };
  }

   jo.event = event;
   if(debug) console.log("Received: " + jo.command)    
   return explorer.explorerShell(jo);
})

// Create a TCP server to communicate with native script

var nativeServer = net.createServer(function(ncom) { 
    ncom.setEncoding("utf8");

    ncom.on('error', function(err) {
        console.log("TCP error: " + err.stack);
    });    

    ncom.on('data', function(data) { 
        if (win && !win.isDestroyed()) {
            win.webContents.send("interface", data);
        }
    });

    ncom.on('end', function() {});
});


nativeServer.listen(1031, '127.0.0.1');

// Electron part

let win = explorer.win;

console.log("Starting Electron...")
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

function createWindow () {
  let w = 1060
  if(debug) w = 1600
  win = new BrowserWindow({width:w, height: 650, "show":false,
    "webPreferences" : {
      nodeIntegration:true,
      contextIsolation:false,
      webSecurity: true,
      enableRemoteModule: true
    }   
  });
  if(debug) win.webContents.openDevTools()

    win.setMenu(null)

    explorer.setRoot(__dirname);
    console.log("Working directory : " + __dirname)

    updateScripts();

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

  require("@electron/remote/main").enable(win.webContents)    
}

if(!debug) process.on('uncaughtException', function (error) { })

app.on('ready', createWindow)

app.on('quit', function () {
    // something to do before to quit
});
app.on('window-all-closed', () => {
  console.log("Explorer window closed, exit.")
  if (process.platform !== 'darwin') app.quit()
  process.exit(1)
})
app.on('activate', () => {
  if (win === null)  createWindow()
})
