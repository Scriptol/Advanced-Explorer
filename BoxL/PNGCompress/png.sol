
# PNG Compress (c) 2015 scriptol.com
# License MIT

# Interface to pngquant

extern var os

var net = require('net')
var oslib = require('os')

~~
os = oslib.platform()

var client = net.connect({port: 1031}, function() {
  console.log("Png.js open TCP connection to server..."); 
});

client.on('end',  function() {  
     console.log('Png.js: TCP connection closed by the server.');  
});

~~

void display(text content)
    print content
    ~~
    client.write(JSON.stringify( { 
        "type":"message", "app": "PNGCompress", "content" : content 
    }));
    ~~
return

void byeServer()
    ~~
    client.end("Bye...");
    ~~
return


void syntax()
  print
	print "PNG 1.0 - www.scriptol.com"
	print "Interface to pngquant when used locally from an HTML page"
	print "Syntax:   node png.js all sourcepath"
	print "    or:   node png.js list sourcepath file [file] etc..."
	print "Options:"
	print "  all : all png file in the source path"
	print " list : list of png files given in argument"
	exit()
return


text getExt(text fname)
    int p = fname.findLast(".")
    if p = nil return ""
    text ext = fname[p + 1 .. ]
return ext

text buildPath(text path, text name)
    if path[-1 ..] = "/" return path + name
return path + "/" + name


# Processing files

boolean compressing(text filelist)

    var program = buildPath(getcwd(), "BoxL/PNGCompress/pngquant")
    
    if os = "win32" 
        program + ".exe"
        filelist = filelist.replace("/", "\\")
    else
        filelist = filelist.replace("\\", "/")
    /if

    text command = program + " -f --ext .png " + filelist
    print command
    
    var res = system(command) 
    print res

return res

#  Main program

int main(int argnum, array arglist)

	# The program requires 3 parameters at least plus the name of the program

	if arglist.size()  < 3 let syntax()

	# Processing options

  arglist.shift()                 // removing the script's name

  print "Png.js arguments: ", arglist.join(' ');

  text mode = arglist.shift().trim()
  text sourcepath = arglist.shift()
  text filelist = " "
  text weblist = ""
  int count = 0
  
  if mode 
  = "list":
	    while arglist.length() > 0
		    text fname = arglist.shift()  
        weblist + fname + "<br>"
		    filelist + buildPath(sourcepath, fname) + " "
        count + 1
	    /while
	 = "all":
	    array dlist = scandir(sourcepath)
      print "Mode all,", dlist.length(),"files."
	    for text fname in dlist
          if getExt(fname) != "png" continue
          fname = buildPath(sourcepath, fname)
	        if filetype(fname) = "file"
                weblist + fname + "<br>"
                filelist + fname +  " "
                count +  1
	        /if
	    /for
	else
	    print "Error", mode, "unknow option."
	/if    

	# Starting 
  
  if count > 0
    boolean res = compressing(filelist)
    if not res let count = 0
  /if  
  
  display(weblist + "<br>" + text(count) + " files compressed.")
  byeServer()

  return 0

main($argc, $argv)

