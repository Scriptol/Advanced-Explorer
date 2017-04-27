/* Generated by Scriptol */

// All static class StrTools
// written by D.G. Sureau (c) 2002-2015
// Scriptol Library - LGPL license
// www.scriptol.com


var StrTools=(function()
{

// count the occurences of sea inside base

   StrTools.count=function(base,sea)
   {
      var ctr=0;      var i=0;
      $_break0:while(true) {
         do {
            i=base.indexOf(sea,i);
            if(i===-1) {
               break $_break0;
            }
            i+=1;
            ctr+=1;
         } while(false);
      }

      return ctr;
   }

   StrTools.splitExt=function(path)
   {
      var l=path.length;      if(l===0) {
         return ["",""];
      }
      for(x=l-1;x>=0;x+=-1) {

         if(path.charAt(x)===".") {
            return [path.slice(0,x-0),path.slice(x+1)];
         }
      }
      return [path,""];
   }


StrTools.cdelimiters=" \\.()[]{},;:?+-*=/&~|\"\'<>!\r\n\t";
// split a line into words, according to list of delimiters
// Take note than the $ symbol can't be used as a delimiter
// due to the Php interpreter.

   StrTools.split=function(line,delims)
   {
      delims=typeof delims !== 'undefined' ? delims : " \t\r\n";

      var words=[];      var newword="";
      for(var $__3=0;$__3<line.length;$__3++)       {
         var c=line.charAt($__3);

         if((delims.indexOf(c)!=-1)) {
            if(newword!="") {
               words.push(newword);
               newword="";
            }
         }         
         else {
            newword+=c;
         }
      }

      if(newword!="") {
         words.push(newword);
      }
      return words;
   }


// Split words
// This function make a list of words from both
// delimited identifiers and sequence of delimiters
// allowing the whole line rebuilt with replacements

   StrTools.splitAll=function(str,delimiters)
   {
      delimiters=typeof delimiters !== 'undefined' ? delimiters : " \r\n\t";

      var words=[];      var newword="";      var delimseq="";
      for(var $__3=0;$__3<str.length;$__3++)       {
         var c=str.charAt($__3);

         if((delimiters.indexOf(c)!=-1)) {

            if(newword!="") {
               words.push(newword);
               newword="";
            }
            delimseq+=c;
         }         
         else {
            if(delimseq!="") {
               words.push(delimseq);
               delimseq="";
            }
            newword+=c;
         }
      }

      // End of string, either a word or a delimiter sequence remains here
      if(newword!="") {
         words.push(newword);
      }
      if(delimseq!="") {
         words.push(delimseq);
      }
      return words;
   }

// Join words & delimiters

   StrTools.join=function(wordlist)
   {

      var str="";      for(var w in wordlist) {
         w=String(wordlist[w]);         str+=w;
      }      return str;
   }

   function StrTools() {
   }
   return StrTools;
})();



/* End */
