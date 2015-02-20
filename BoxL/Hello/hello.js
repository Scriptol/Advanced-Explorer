/* Hello World between a browser and a local server 
   by Scriptol.com */    

var net = require('net');

console.log("\nStarting hello.js");

// Read and display arguments given to this script
// in this case, a message from the browser.

var argLength = process.argv.length-1;
var argList = process.argv.slice(2);
var content = argList.join(" ");

console.log("From browser: " + content);  

function toBrowser()
{
  console.log("Hello.js answers 'Hello browser!' via local server...");

  client.end(JSON.stringify( { 
    "type":"message", 
    "app": "Hello", 
    "content" : "Hello browser!" 
  }));
}

// Open a local socket connection

var client = net.connect({port: 1031}, function() { 
  console.log('Hello.js connected to local server...');
  toBrowser(); 
});

client.on('end', function() {
    console.log('Hello.js now disconnected from local server.');
});


/* end */