# All static class StrTools
# written by D.G. Sureau (c) 2002-2015
# Scriptol Library - LGPL license
# www.scriptol.com


class StrTools

# count the occurences of sea inside base

static int count(text base, text sea)
  int ctr = 0
  int i = 0

  while forever
   i = base.find(sea, i)
   if i = nil ? break
   i + 1
   ctr + 1
  /while

return ctr

static text, text splitExt(text path)
	int l = path.length()
	if l = 0 ? return "", ""
	for int x in l - 1 .. 0 step -1
		if path[x] = "." ? return path[--x], path[x + 1..]
	/for
return path, ""


static text cdelimiters = " \\.()[]{},;:?+-*=/&~|\"\'<>!\r\n\t"

# split a line into words, according to list of delimiters
# Take note than the $ symbol can't be used as a delimiter
# due to the Php interpreter.

static array split(text line, text delims = " \t\r\n"):
 array words = []
 text newword = ""

 for text c in line
  if c in delims                            // char in delimiter list
    if newword <> ""
      words.push(newword)                   // then word ended, add it
      newword = ""                          // clear it
    /if
  else:                                     // else char in a word
    newword + c                             // add char to word
  /if
 /for

 if newword <> "" ? words.push(newword)     // add a remaining word
return words


# Split words
# This function make a list of words from both
# delimited identifiers and sequence of delimiters
# allowing the whole line rebuilt with replacements

static array splitAll(text str, text delimiters = " \r\n\t"):
 array words = []
 text newword = ""
 text delimseq = ""

 for text c in str:
  if c in delimiters:            // char in delimiter list
   if newword <> ""
     words.push(newword)         // then word ended, add it
     newword = ""                // clear it
   /if
   delimseq + c                  // add delimiter to sequence
  else:                          // else char in a word
   if delimseq != ""
     words.push(delimseq)        // then delim seq ended, add it
     delimseq = ""               // clear it
   /if
   newword + c                   // add char to word
  /if
 /for

 # End of string, either a word or a delimiter sequence remains here
 if newword != "" ? words.push(newword)
 if delimseq != "" ? words.push(delimseq)
return words

# Join words & delimiters

static text join(array wordlist):
 text str = ""
 for text w in wordlist ? str + w
return str

/class