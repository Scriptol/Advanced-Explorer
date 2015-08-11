
# Searep - Search & Replace - Freeware (c) 2004-2015  by Denis G. Sureau
# www.scriptol.com


# This program searches and replaces a string in a file,
# or the current directory and subdirectories.

# The search can be performed case-sensitive or not.
# One can search for identifiers in C, Scriptol or other sources,
# or any string in any pure ASCII text.

# By changing the "cdelimiters" string in strtools, you may specify what are identifiers.

include "pattern.sol"
include "strtools.sol"

extern text os

var net = require('net')
var oslib = require('os')

text separator = "/"
boolean isWin = false

~~
var client = net.connect({port: 1031}, function() {
  console.log("Replace.js open TCP connection to server...");
});

client.on('end',  function() {  
     console.log('Replace.js: TCP connection closed by the server.');  
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
boolean INCODE = false
boolean RECURSE = true
boolean VERBOSE = false

const int PADLEFT = $(STR_PAD_LEFT)

int TOTAL = 0       // Total files
int MATCHES = 0     // Total selected files
number COUNTER = 0  // Occurences

text pattern = ""
text searching = ""
text replacing = ""

void syntax(text message = "")
	print "Search & Replace 1.7 - www.scriptol.com."
	print "Syntax:   searep [option] search-string replacing-string file."
	print "    or:   searep [option] search-string replacing-string pattern."
	print "    or:   php -q searep.php etc..."
	print "Options:"
	print "  -l   search in list."
	print "  -i   ignore case for strings (default case-sensitive)."
	print "  -c   search identifiers inside code (default string in text)."
	print "  -u   unix style, filename case sensitive (default ignore case)."
	print "  -l   current directory only (default recursively scan subdirectories)."
    print "  -v   verbose, display more infos."
    print "  -q   quiet, don't display matches (default display)." 
	print "  -iculv is the format for multiple options"
    print
    if not (message = "") print message
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

file openfile(text filename, text mode)
	file f
	f.open(filename, mode)
	error
		display("Enable to open " + filename)
		return nil
	/error
return f

boolean clean(text dstname)
	if file_exists(dstname)
		if not unlink(dstname)
			display("Enable to clean " + dstname + " replacing cancelled.")
			return false
		/if
	/if
return true


# Replace words in string
# as text.replace(), but case-sensitive or no, and count occurences

text replace(text line):

	number sealen =  searching.length()
	number replen =  replacing.length()
	number linelen = line.length()

	if TEXTCASE = false               // Ignore case
		searching  = searching.lower()
		line = line.lower()
	/if

	int idx = 0
	text idr = ""

	while (idx + sealen) < linelen
		idx = line.find(searching, idx)       // Is "searching" inside line?
		if idx = nil  break                 // No more occurence, exit
		if idx = 0 
		    line = replacing + line[idx + sealen..]
		else
			line = line[0--idx] + replacing + line[idx+sealen..]
		/if

		idx + replen                          // Skipping scanned part of iline
		linelen = line.length()
		COUNTER + 1
	/while
 return line

# Replaces a file
# Makes it ".bak" and renames a temporary file to its name
# Change a temporary file into original file
# the original file become a .bak file

void replacefile(text srcname, text dstname):

	// If source filename is node.ext it becomes node.bak
	// but if node itself is the name of an existing file,
	// source file will be renamed rather node.ext.bak

	text node, ext
	node, ext = StrTools.splitExt(srcname)
	if file_exists(node)
		if ext != "" then  node = srcname
	/if

	text newname = node + ".bak"
	unlink(newname)
	rename(srcname, newname)   // Previous renamed as .bak
	rename(dstname, srcname)   // Temporary gets name of previous file
return


# Replace identifier in file
# Replace occurence of "searching" by "replacing" in file "filename"

number replaceid(text srcname)

	if VERBOSE ? display("Replacing identifier " + searching + 
     " by " + replacing + " in " + heading(srcname))

	# Making a temporary file
	text dstname = srcname + ".tmp"
	if not clean(dstname) ? return 0

	if TEXTCASE = false ? searching = searching.lower()
	array src
	src.load(srcname)

	number linenum = 0
	text lowsearch = searching.lower()

	for text line in src
		int oldcounter = COUNTER
		text newline = ""
		array srcwords = line.split(StrTools.cdelimiters)

		# Adding either same or replacing word
		
		for text cmp in srcwords
			text word = cmp
			if searching = cmp
				word = replacing
				COUNTER + 1
			else
				if (TEXTCASE = false) and (lowsearch = cmp.lower())
					word = replacing
					COUNTER + 1
				/if
			/if
			newline + word
		/for

		linenum + 1
		src[] = newline

		if (not QUIET) and (COUNTER > oldcounter)
			if not VERBOSE ? display(heading(srcname) + ": " +  
			 pad(strval(linenum), 4, "0", PADLEFT) + ": ")
		/if
	 		
	/for

	// writing the content
	
	file dst
	dst.open(dstname, "w")
	error ? die("enable to write on " + dstname)
	for text line in src ? dst.write(line)
	dst.close()

	// Now replacing the old file with the new updated one
	
	replacefile(srcname, dstname)

return COUNTER


# Replace a string in an ascii file
# Replace occurences of "searching" by "replacing" in file "filename"

int replacestr(text srcname):

	if VERBOSE ? display("Replacing string \"" + searching + 
      "\" by \"" + replacing + "\" in " + heading(srcname))

	// Making a temporary file
	
	text dstname = srcname + ".tmp"
	if not clean(dstname) ?  return 0

	array src
	src.load(srcname)

	int linenum = 1
 
	for text line in src
		int oldcounter = COUNTER
		line = replace(line)
		if (not QUIET) and (COUNTER > oldcounter)
			if not VERBOSE echo heading(srcname), ": "  
			echo pad(strval(linenum), 4, "0", PADLEFT), ": ", line
		/if
		linenum + 1
		src[] = line
	/for

	file dst = openfile(dstname, "wb")
	if dst = nil ? return 0
	for text line in src ? dst.write(line)
	dst.close()
	# Now replacing the old file with the new updated one
	replacefile(srcname, dstname)
	
return COUNTER


# Parsing the directory

void scanning(text thedir)

	array dirarray
	text filename
	text dirname
    
    if VERBOSE ? display("<br><b>" + thedir + "</b>")
 
  	array dirlist = []
  	array filelist = []
  	if filetype(thedir) = "file"
        filelist.push(thedir)
  	else        
        filelist = scandir(thedir)
  	/if 

    for filename in filelist
        if filename = nil  break
        if filename in [".", ".."]  continue
        
        filename = buildPath(thedir, filename)
		if filetype(filename) = "file"
			TOTAL + 1          // Total files found
			if patmatch(pattern, filename, FILECASE):
				MATCHES + 1    // Selected files count
				if INCODE = true
					replaceid(filename)
				else:
					replacestr(filename)
				/if
			/if
        else
            dirlist.push(filename)
	    /if
   /for

    if RECURSE = false  return

    for dirname in dirlist
        if dirname = nil ? break
        if dirname in [".", ".."] continue
		if filetype(dirname) = "dir"
       		scanning(dirname)
		/if
   /for
   
return

#---------------------------------------------------
#                   Main program
#---------------------------------------------------


int main(int argnum, array arglist)

	# The program requires 3 parameters plus one or two optionnals

    int s =  arglist.size()
	if s < 3  ? syntax("$s arguments, 3 or more required.")

	# Defaults

	TEXTCASE = true
	QUIET = false
	FILECASE = false
	INCODE = false
	RECURSE = false

	# Processing options

	arglist.shift()                 // removing the script's name
	text optstr = arglist[0]
	text optchr = optstr[0]

	while (optchr = '-') or (optchr = '/'):
		text opt = optstr[1..]
		arglist.shift()               // now removing the option list
		for text i in opt:
			if i
      		= 'l': INLIST = true        // file or list of files
			= 'i': TEXTCASE = false     // Ignore case for text
			= 'c': INCODE = true       	// Not pure text processing
			= 'u': FILECASE = true      // Filenames case-sensitive
			= 'q': QUIET = true         // Don't display found/changed lines
			= 'f': VERBOSE = true       // Display parsed file
			= 'r': RECURSE = true       // Scan subdirectories
			= 'v': VERBOSE = true       // Display more infos
			else:
				display( i + " bad option")
				syntax()
			/if
		/for
        optstr = arglist[0]
        optchr = optstr[0]
	/while

	if arglist.size() = 3          // if there is a replacing string
		replacing = arglist[1]
		arglist[1..1] = nil        // removing the replacing element
    else
        display("Wrong number of arguments...")
        syntax()   
	/if

	searching = arglist[0]
	pattern   = arglist[1]
	
	if VERBOSE ? display("Replacing " + searching + " by " + replacing)
  
    if (replacing[0] = "-") or (searching[0] = "-") or (pattern[0] = "-")
        display("Put options at beginning...")
        syntax()
    /if   
    
	# Starting the search

    text searchpath = pattern
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

main($argc, $argv)
