
# Search - Freeware (c) 2004-2015 by Denis G. Sureau
# www.scriptol.com/scripts/


# This program searches a string in a file,
# or all files in the directory (and subdirectories if asked)
# The search can be performed case-sensitive or not.
# One can search for identifiers in C-like languages,
# or any string in any ASCII text.


include "pattern.sol"

extern text os

var net = require('net')
var oslib = require('os')

text separator = "/"
boolean isWin = false

~~
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
~~

# Global declarations

boolean INLIST = false
boolean TEXTCASE = false
boolean QUIET = false
boolean FILECASE = false
boolean RECURSE = true
boolean VERBOSE = false

const int PADLEFT = $(STR_PAD_LEFT)

int TOTAL = 0       // Total files
int MATCHES = 0     // Total selected files
number COUNTER = 0  // Occurences
text pattern = ""
text searching = ""

void syntax()
	print "Search 1.7 - www.scriptol.com."
	print "Syntax:   search [option] search-string file."
	print "    or:   search [option] search-string."
	print "    or:   php -q search.php etc..."
	print "Options:"
	print "  -l   search in list."	
	print "  -i   ignore case for strings (default case-sensitive)."
	print "  -c   search identifiers inside code (default string in text)."
	print "  -u   unix style, filename case sensitive (default ignore case)."
	print "  -l   current directory only (default recursively scan subdirectories)."
	print "  -v   verbose, display more infos."
	print "  -q   quiet, don't display results (default display)." 
	print "  -iculv is the format for multiple options"
	exit()
return


text buildPath(text path, text name)
    if path[-1 ..] = separator return path + name
return path + separator + name


void display(text content)
    print content
    ~~
    var client = net.connect({port: 1031}, function() {
      client.end(JSON.stringify( { 
        "type":"message", "app": "search", "content" : content 
    	}));
	});
    ~~
return
   

# Open a file

file openfile(text filename, text mode):
	file f
	f.open(filename, mode)
	error
		display("Enable to open " + filename)
		return nil
	/error
return f


# Search string in ascii text
# Search occurences of string "searching" in file "filename"

int searchString(text srcname)

	file src = openfile(srcname, "r")
	if src = nil 
    	display("Error: " + srcname + " not found.")
    	return 0
  	/if

	display("<br><u><b>" + srcname + "</b></u>")

	int linenum = 0
	if TEXTCASE = false ? searching = searching.lower()

	while forever
		var line = src.readline()
		if line = false ? break
		linenum + 1
		if TEXTCASE = false ? line = line.lower()

		# Locating, counting and displaying

		if line.find(searching) <> nil
			if (not QUIET) let display( pad(strval(linenum), 4, "0", PADLEFT) + ": " + line)
			COUNTER + StrTools.count(line, searching)
		/if
	/while

	src.close()
return COUNTER


# Parsing the directory of processing a single file

array GRAPHICS = [ "png", "jpg", "jpeg", "gif", "mpg" ]

void scanning(text thedir)

	array dirarray
	text filename
	text dirname
	text namep
	text ext
    
  	if VERBOSE ? display("<br><b>" + thedir + "</b>")
 
  	array dirlist = []
  	array filelist = []
	bool fileFlag = false  
  	if filetype(thedir) = "file"
        filelist.push(thedir)
		fileFlag = true
  	else        
        filelist = scandir(thedir)
  	/if    

  	for filename in filelist
      	if filename = nil  break
      	if filename in [".", ".."]  continue
  		namep, ext = StrTools.splitExt(filename) 
		if ext in GRAPHICS ? continue  
		if fileFlag = false  
      		filename = buildPath(thedir, filename)
		/if	  
 	    if filetype(filename) = "file"
 		    TOTAL + 1        // Total files found
		    if (fileFlag = true) or patmatch(pattern, filename, true)
		        MATCHES + 1    // Selected files count
			    searchString(filename)
			/if
         else
            dirlist.push(filename)
	    /if
    /for

    if RECURSE = false return
	if fileFlag = true return

    for dirname in dirlist
        if dirname = nil ? break
    	scanning(dirname)
    /for
   
return

#---------------------------------------------------
#                   Main program
#---------------------------------------------------


int main(int argnum, array arglist)

	# The program requires 3 parameters plus one or two optionnals

	if arglist.size()  < 2 ? syntax()

	# Defaults

	TEXTCASE = true
	QUIET = false
	FILECASE = false
	RECURSE = false

	# Processing options

	arglist.shift()                 // skips script's name
	text optstr = arglist[0]
	text optchr = optstr[0]

	while (optchr = '-') or (optchr = '/'):
		text opt = optstr[1..]
		arglist.shift()               // skips the option 
		for text i in opt:
			if i
      		= 'l': INLIST = true        // file or list of files
			= 'i': TEXTCASE = false     // Ignore case for text
			= 'q': QUIET = true         // Don't display found/changed lines
			= 'f': VERBOSE = true       // Display parsed file
			= 'r': RECURSE = true       // Scan subdirectories
			= 'v': VERBOSE = true       // Display more infos
			else:
				print i , "bad option"
				syntax()
			/if
		/for
        optstr = arglist[0]
        optchr = optstr[0]
	/while

	if arglist.size() > 2
        display("Too much arguments.")
        syntax()
	/if

	searching = arglist[0]
	pattern   = arglist[1]
display("AFTER OPT $searching $pattern")    
  	if (searching[0] = "-") or (pattern[0] = "-")
      	display("Put options at beginning...")
      	syntax()
  	/if       
	
	# Starting the search

  	text searchpath = pattern
display("STARTING")
  	if INLIST
    	pattern = ""
  	else
    	if wildcard(pattern)
      		int p = pattern.find("/")
      		if (p > 0)  
          		searchpath = pattern[0 .. p -1]
          		pattern = pattern[p + 1 ..]
      		/if
    	/if
  	/if      

	if isWin 
		searchpath = searchpath.replace("/", "\\") 
	else 
		searchpath = searchpath.replace("\\", "/") 
	/if	
	display("Searching for '$searching' in $searchpath")
  	scanning(searchpath)

	text result = "<hr>" + text(TOTAL) + " file" + plural(TOTAL) + ", " +
		text(MATCHES) + " file" + plural(MATCHES) + " matching, " +
		text(COUNTER) +  " occurence" + plural(COUNTER) + " found.<hr>"
  	display(result)  
		
  	return 0

main($argc,$argv)
