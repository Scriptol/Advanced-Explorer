/* Generated by Scriptol */

var fs = require('fs');
var scriptol = require('c:/scriptolj/scriptol.js');

// Search - Freeware (c) 2004-2015 by Denis G. Sureau
// www.scriptol.com/scripts/


// This program searches a string in a file,
// or all files in the directory (and subdirectories if asked)
// The search can be performed case-sensitive or not.
// One can search for identifiers in C-like languages,
// or any string in any ASCII text.


eval(fs.readFileSync(__dirname + '/pattern.js')+'');




var net=require('net');
var oslib=require('os');

var separator="/";
var isWin=false;


var client = net.connect({port: 1031}, function() {
  console.log("Search.js open TCP connection to server...");
});

client.on('end',  function() {
     console.log('Search.js: TCP connection closed by the server.');
});

os = oslib.platform();

if(os == "win32") {
  separator = "\\";
  isWin = true;
}


// Global declarations

var INLIST=false;
var TEXTCASE=false;
var QUIET=false;
var FILECASE=false;
var RECURSE=true;
var VERBOSE=false;

var PADLEFT=scriptol.STR_PAD_LEFT;

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
   console.log("  -u   unix style, filename case sensitive (default ignore case).");
   console.log("  -l   current directory only (default recursively scan subdirectories).");
   console.log("  -v   verbose, display more infos.");
   console.log("  -q   quiet, don't display results (default display).");
   console.log("  -iculv is the format for multiple options");
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
   console.log(content);
   
    var client = net.connect({port: 1031}, function() {
      client.end(JSON.stringify( {
        "type":"message", "app": "search", "content" : content
    	}));
	});
    
   return;
}

// Open a file

function openfile(filename,mode)
{

   var f={};
   $error=(f=scriptol.fopen(filename,mode));
   if($error===false) {
      display("Enable to open "+filename);
      return false;
   }
   return f;
}

// Search string in ascii text
// Search occurences of string "searching" in file "filename"

function searchString(srcname)
{

   var src=openfile(srcname,"r");
   if(src===false) {
      display("Error: "+srcname+" not found.");
      return 0;
   }

   display("<br><u><b>"+srcname+"</b></u>");

   var linenum=0;
   if(TEXTCASE===false) {
      searching=searching.toLowerCase();
   }

   $_break0:while(true) {
      do {
         var line=scriptol.fgets(src);
         if(line===false) {
            break $_break0;
         }
         linenum+=1;
         if(TEXTCASE===false) {
            line=line.toLowerCase();
         }

         // Locating, counting and displaying

         if(line.indexOf(searching)!=-1) {
            if((!QUIET)) {
               display(scriptol.pad(String(linenum),4,"0",PADLEFT)+": "+line);
            }
            COUNTER+=StrTools.count(line,searching);
         }
      } while(false);
   }

   scriptol.fclose(src);
   return parseInt(COUNTER);
}

// Parsing the directory of processing a single file

var GRAPHICS=["png","jpg","jpeg","gif","mpg"];

function scanning(thedir)
{

   var dirarray=[];
   var filename="";
   var dirname="";
   var namep="";
   var ext="";

   if(VERBOSE) {
      display("<br><b>"+thedir+"</b>");
   }

   var dirlist=[];
   var filelist=[];
   var fileFlag=false;
   if(scriptol.filetype(thedir)==="file") {
      filelist.push(thedir);
      fileFlag=true;
   }   
   else {
      filelist=fs.readdirSync(thedir);
   }

   for(filename in filelist) {
      filename=filelist[filename];
      if(filename==="") {
         break;
      }
      if(([".",".."].indexOf(filename)!=-1)) {
         continue;
      }
      $_I2=StrTools.splitExt(filename);
      namep=$_I2[0];
      ext=$_I2[1];
      if((GRAPHICS.indexOf(ext)!=-1)) {
         continue;
      }
      if(fileFlag===false) {
         filename=buildPath(thedir,filename);
      }
      if(scriptol.filetype(filename)==="file") {
         TOTAL+=1;
         if((fileFlag===true)||patmatch(pattern,filename,true)) {
            MATCHES+=1;
            searchString(filename);
         }
      }      
      else {
         dirlist.push(filename);
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
      if(dirname==="") {
         break;
      }
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
   QUIET=false;
   FILECASE=false;
   RECURSE=false;

   // Processing options

   arglist.shift();
   var optstr=arglist[0];
   var optchr=optstr.charAt(0);

   $_break0:while((optchr==='-')||(optchr==='/')) {
      do {
         var opt=optstr.slice(1);
         arglist.shift();
         for(var $__3=0;$__3<opt.length;$__3++)          {
            var i=opt.charAt($__3);

            
            if(i==='l') {
               INLIST=true;
            }            
            else {
               if(i==='i') {
                  TEXTCASE=false;
               }            
            else {
               if(i==='q') {
                  QUIET=true;
               }            
            else {
               if(i==='f') {
                  VERBOSE=true;
               }            
            else {
               if(i==='r') {
                  RECURSE=true;
               }            
            else {
               if(i==='v') {
                  VERBOSE=true;
               }            
            else {
               console.log(i+' '+"bad option");
               syntax();
            }            }}}}}
         }
         optstr=arglist[0];
         optchr=optstr.charAt(0);
      } while(false);
   }

   if(arglist.length>2) {
      display("Too much arguments.");
      syntax();
   }

   searching=arglist[0];
   pattern=arglist[1];
   display("AFTER OPT "+searching+" "+pattern);
   if((searching.charAt(0)==="-")||(pattern.charAt(0)==="-")) {
      display("Put options at beginning...");
      syntax();
   }

   // Starting the search

   var searchpath=pattern;
   display("STARTING");
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

   if(isWin) {
      searchpath=searchpath.replace("/","\\");
   }   
   else {
      searchpath=searchpath.replace("\\","/");
   }
   display("Searching for '"+searching+"' in "+searchpath);
   scanning(searchpath);

   var result="<hr>"+String(TOTAL)+" file"+(TOTAL>1?"s":"")+", "+String(MATCHES)+" file"+(MATCHES>1?"s":"")+" matching, "+String(COUNTER)+" occurence"+(parseInt(COUNTER)>1?"s":"")+" found.<hr>";
   display(result);

   return 0;
}
main(process.argv.length-1,process.argv.slice(1));


/* End */