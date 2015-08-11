/*
    Pattern  - Scriptol tool by D.G. Sureau

    This function compares two filenames
    Node or extension may be replaced by *
    Any char may be replaced by ?
    and return true if the two files match.
*/

include "strtools.sol"

# Comparing two strings, first with wildcards

boolean matchingstr(text str1, text str2, boolean casesensitive = false)

  if str1 = '*' ? return true
  if str2 = '*' ? return true
  int l = str1.length()
  if l <> str2.length() ? return false

  if not casesensitive
    str1 = str1.lower()
    str2 = str2.lower()
  /if

  # now comparing each char, but the ? wildcard
  for int i in 0..l - 1
    text c = str1[i]
    text d = str2[i]
    if c = '?' ? continue
    if d = '?' ? continue
    if c <> d ? return false
  /for

return true


# Comparing two filenames with wildcards

boolean patmatch(text pattern, text filename, boolean casesensitive = false)
  if pattern = "" return true

  # Extracting node and last extension
  text namep, extp, namef, extf
  namep, extp = StrTools.splitExt(pattern)
  namef, extf = StrTools.splitExt(filename)
  if not matchingstr(namep, namef, casesensitive) ? return false
  if not matchingstr(extp, extf, casesensitive) ?   return false
return true

# Check if wildcard

boolean wildcard(text str)
    int p = str.findLast("/")
    if p = nil
      p = str.findLast("\\")
      if p = nil return false
    /if
    text pattern = str[p + 1 ..]  
    p = pattern.find(".")
    if p = nil return false
    if pattern[0 -- p] = "*" return true
    if pattern[p .. ]  = "*" return true
return false    
