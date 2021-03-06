/* Generated by the Scriptol compiler */

// Search - Freeware (c) 2004-2017 by Denis G. Sureau
// www.scriptol.com/scripts/


// This program searches a string in a file,
// or all files in the directory (and subdirectories if asked)
// The search can be performed case-sensitive or not.
// One can search for identifiers in C-like languages,
// or any string in any ASCII text.


var fs=require('fs');
var net=require('net');
var oslib=require('os');
var path=require("path")

eval(fs.readFileSync(__dirname + '/pattern.js')+'');

var client = net.connect({port: 1031}, function() {
  console.log("Search.js open TCP connection...");
});

client.on('end', function() {
     console.log('Search.js: TCP connection closed by the server.');
});

// Global declarations

var INLIST=false;
var TEXTCASE=false;
var RECURSE=true;
var VERBOSE=false;
var separator="/";

var TOTAL=0;
var MATCHES=0;
var COUNTER=0;
var pattern="";
var searching="";

function syntax()
{
   console.log("Search 1.7 - www.scriptol.com.");
   console.log("Syntax:   search [option] search-string file.");
   console.log("    or:   search [option] search-string.");
   console.log("    or:   php -q search.php etc...");
   console.log("Options:");
   console.log("  -l   search in list.");
   console.log("  -i   ignore case for strings (default case-sensitive).");
   console.log("  -c   search identifiers inside code (default string in text).");
   console.log("  -r   recurse, default current directory only");
   console.log("  -v   verbose, display more infos.");
   console.log("  -icrlv is the format for multiple options");
   process.exit();
   return;
}

function buildPath(path,name)
{
   if(path.slice(-1)===separator) {
      return path+name;
   }
   return path+separator+name;
}

function display(content)
{
   if(VERBOSE) console.log(content);
   var client = net.connect({port: 1031}, function() {
      client.end(JSON.stringify( {
        "action":"message", "app": "search", "content" : content
     	}));
	});
   return;
}

function encodeHTML(line) {
  line = line.replace("<", "&lt;")
  line = line.replace(">", "&gt;")
  return line;
}

// Search string in ascii text
// Search occurences of string "searching" in file "filename"

function searchString(srcname)
{
  var titleflag = true;
  var src=new String(fs.readFileSync(srcname));
  if(src===false) {
      display("Error: "+srcname+" not found.");
      return 0;
  }
  var linenum=0;
  var content = src.split("\n")
  for(var line in content) {
      line = content[line]
      linenum+=1;  
      if(line=="") continue;
      if(TEXTCASE===false) {
           line=line.toLowerCase();
      }
      if(line.indexOf(searching)!=-1) {
          if (titleflag) {
            display("<br>"+srcname);
            titleflag = false;
          }  
          var strnum = "0000" + String(linenum);
          display(strnum.substr(-4)+": " + encodeHTML(line));
          COUNTER++;
      }
  }
   return COUNTER;
}

// Parsing the directory of processing a single file

var GRAPHICS=[".png",".jpg",".jpeg",".gif",".mpg", ".vob", ".raw", ".tif", ".mpeg"];

function scanning(thedir)
{
   var filename;
   var dirname;
   var dirlist=[];
   var filelist=[];
   var fileFlag=false;

   var stats = fs.statSync(thedir);
   if(stats.isDirectory()) {  
        display("<br><u><b>"+thedir+"</b></u>");
        filelist=fs.readdirSync(thedir);
   } else {    
        filelist.push(thedir);
        fileFlag=true;
   }   

   for(filename in filelist) {
     filename = filelist[filename]
      if(filename=="") break;
      if(filename in [".",".."]) continue;
      var ext = path.extname(filename);
      if(ext in GRAPHICS) continue;
      if(fileFlag===false) {
         filename=buildPath(thedir,filename);
      }
      var stats = fs.statSync(filename);
      if(stats.isDirectory()) {
         dirlist.push(filename);
      }
      else {
         TOTAL++;
         if((fileFlag===true)||patmatch(pattern,filename,true)) {
            MATCHES++;
            searchString(filename);
         } 
      }      
   }

   if(RECURSE===false) {
      return;
   }
   if(fileFlag===true) {
      return;
   }

   for(dirname in dirlist) {
      dirname=dirlist[dirname];
      if(dirname=="") break;
      scanning(dirname);
   }

   return;
}

//---------------------------------------------------
//                   Main program
//---------------------------------------------------

function main(argnum,arglist)
{
  // The program requires 3 parameters plus one or two optionnals
  if(arglist.length<2) {
      syntax();
  }

  // Defaults

  TEXTCASE=true;
  RECURSE=false;

  // Processing options

  arglist.shift();
  var optstr=arglist[0];
  var optchr=optstr.charAt(0);

  while((optchr==='-')||(optchr==='/')) {
       var opt=optstr.slice(1);
       arglist.shift();
       for(var o = 0; o < opt.length; o++)          {
            var i=opt.charAt(o);
            switch(i) {
             case 'l': INLIST=true; break;
             case 'i': TEXTCASE=false; break;
             case 'r': RECURSE=true; break;
             case 'v': VERBOSE=true; break;
             default:
               console.log(i+' '+"bad option");
               syntax();
            }            
      }
      optstr=arglist[0];
      optchr=optstr.charAt(0);
  }

  if(arglist.length>2) {
      display("Too much arguments.");
      syntax();
  }

  searching=arglist[0];
  if(TEXTCASE===false) {
      searching=searching.toLowerCase();
  }   
  pattern=arglist[1];
  if((searching.charAt(0)==="-")||(pattern.charAt(0)==="-")) {
      display("Put options at beginning...");
      syntax();
  }

  // Starting the search

  var searchpath=pattern;
  if(INLIST) {
      pattern="";
  }   
  else {
      if(wildcard(pattern)) {
         var p=pattern.indexOf("/");
         if((p>0)) {
            searchpath=pattern.slice(0,p-1-0+2);
            pattern=pattern.slice(p+1);
         }
      }
  }
  searchpath=searchpath.replace("\\","/");
  display("Searching for '"+searching+"' in "+searchpath);
  scanning(searchpath);

  var result="<hr>"+String(TOTAL)+" file"+(TOTAL>1?"s":"")+
   ", "+String(MATCHES)+" file"+(MATCHES>1?"s":"")+" matching, "+
   String(COUNTER)+" occurence"+(parseInt(COUNTER)>1?"s":"")+" found.<hr>";
   display(result);
  return 0;
}
main(process.argv.length-1,process.argv.slice(1));

