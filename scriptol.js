// Scriptol.js
// (c) 2014 Scriptol.com - License: Apache 2.0
// Compatibility: ES Harmony.  IE 9.


var vm = require('vm');
var fs = require('fs');

exports.isHTML = false;

/* Scriptol extensions */

exports.include = function(path) {
    var code = fs.readFileSync(path);
    vm.runInThisContext(code, path);
}.bind(this);


exports.display = function(str) {
  if(this.isHTML)
     document.write(str)
  else  
     console.log(str)
}

/* Math */

exports.sign=function(n) {
  return (n = +n) ? n < 0 ? -1 : 1 : n;
}

exports.fmod = function (a,b) { 
  return Number((a - (Math.floor(a / b) * b)).toPrecision(8)); 
};

/* String */

exports.capitalize = function(t) 
{
  return t.charAt(0).toUpperCase() + t.slice(1);
}

exports.dup = function(t, n) {
  return Array(n + 1).join(t);
}

exports.fill = function(f, n) {
  return Array(n + 1).join(f);
}

exports.findLex = function(t, tsea, pos)
{
   return t.toLowerCase().indexOf(tsea.toLowerCase(), pos)
}

exports.insert = function(t, pos, t2)
{
  return t.slice(0, pos) + t2 + t.slice(pos)
}

exports.ltrim = function(t) 
{
  if(typeof t === "undefined" || t == false) return "";
	return t.replace(/^\s+/,"");
}

exports.rtrim = function(t) 
{
  if(typeof t === "undefined" || t == false) return "";
	return t.replace(/\s+$/,"");
}

exports.replace = function(s, sea, rep)
{
  var pattern = "/" + sea + "/gi";
  return s.replace(pattern, rep);
}

exports.isNumber = function(t)
{
  return Number(t) != false;
}

exports.reserve = function(t, size)
{
  return Array(size + 1).join(' ');
}

exports.setCharAt = function(s, i, c) {
  if(i > s.length) return s + c;
  return s.substr(0, i) + c + s.substr(i + 1);
}

exports.strcmp = function(s1, s2) {
  if(s1 < s2) return -1;
  if(s1 > s2) return 1;
  return 0;
}

/* Arrays */

exports.sum = function(a)
{
  var sum = 0; 
  for(var i=0;i<a.length;i++) if(a[i])sum += a[i];
  return sum;
}

exports.arrayMin = function(a)
{
  if(a.length < 0) return 0;
  var m = Number.MAX_VALUE;
  for(var i=0;i<a.length;i++) 
    if(a[i] && a[i]<m) m=a[i];
  return m;
} 

exports.arrayMax = function(a)
{
  var m = 0;
  for(var i=0;i<a.length;i++) 
    if(a[i] && a[i] > m) m = a[i];
  return m;
}

exports.arrayRand = function(a) {
  return a[Math.floor(Math.random()*a.length)];
}

exports.empty = function(a) {
  if(a == undefined) return true;
  return a.length == 0;
}

exports.key = function(a, x) {
  for(var i in a)
    if(a[i]==x) return i;
  return false;  
}

exports.arrayLoad = function(a, name) {
  a.splice(0, a.length);
  var b = fs.readFileSync(name).toString().split("\n");
  for(var x in b) a[x]= b[x].trim(); 
}

var SORT_REGULAR = 0;  // alpha
var SORT_NUMERIC = 1;  // num
 
exports.sort = function(a, o) {
  if(o == undefined || o == SORT_REGULAR) {
    a.sort();
    return;
  }    
  a = a.sort(function(x, y) { return x - y});
  return;
}

exports.rsort = function(a, o) {
  if(o == undefined || o == SORT_REGULAR) {
    a.sort();
    a.reverse();
    return;
  }    
  a = a.sort(function(x, y) { return y - x});
  return;
}  

exports.diff = function(a, b) {
  return a.filter(function(x) {return b.indexOf(x) < 0;});
}

exports.intersect = function(a, b) {
  return a.filter(function(x) {return b.indexOf(x) >= 0;});
}

exports.pack = function(a) {
  var b = a.filter(Boolean);
  a.splice.apply(a, [0, a.length].concat(b));
}

exports.unique = function(a) {
  return  a.filter( function(item, pos, x) { return x.indexOf(item) === pos; } ); 
}

exports.splice = function(a, low, up, inserted) {
  b = a.slice();
  return b.splice.apply(a,[low,up].concat(inserted));
}

exports.fileToArray = function(fname) {
    return fs.readFileSync(fname).toString().split("\n");
}

exports.range = function(a, b) {
  var arr = [];
  for(var i = a; i <= b; i++)
    arr.push(i);
  return arr;
}

exports.aCompare = function(a, b, code) {
  switch(code) {
    case "=": 
      if(a.length != b.length) return false;
      return a.join() == b.join();
    case "!":
    case "<":  
      if(a.length != b.length) return true;
      return a.join() != b.join();
    default:    
      break;
  }  

  return false;
}



// Dictionary

exports.dSize = function(d) {
  return Object.keys(d).length; 
}

exports.aksort = function(d, o) {
  return;  // put keys in order, does nothing, for compatibility with PHP
}

exports.ksort = function(d, o) {
  var k = this.keys(d);
  var cl = this.clone(d);
  for(var i = 0;i < k.length; i++) {
    delete d[ k[i] ]; 
  }
  k.sort()
  for(var i = 0;i < k.length; i++) {
    d[ k[i] ] = cl[ k[i] ]; 
  }
}

exports.vsort = function(d, o) {
  var c = {};
  var k = Object.keys(d);
  k.sort(function(a,b) {   
      if(d[a] < d[b]) return -1;
      if(d[a] > d[b]) return 1;
      return 0;  
  });
 
  for(var x in d) {
    c[x] = d[x]; 
    delete d[x];
  }  
  for(var i = 0;i < k.length; i++) {
    d[ k[i] ] = c[ k[i] ]; 
  } 
}

exports.keys = function(d) {  // keys of a dict
  return Object.keys(d);
}

exports.values = function(d) {  // values of a dict
  return Object.keys(d).map(function (k) { return d[k];});
}

exports.hasKey = function(d, k) {   // checks if the key/property exists
  return(k in d);
}

exports.clone = function(ob) {
   var cl = {}
   for(var i in ob) {
      if(typeof(ob[i])=="object" && ob[i] != null)
            cl[i] = this.clone(ob[i]);
        else
            cl[i] = ob[i];
   }
   return cl;
}

exports.dFind = function(d, val) {
  for(var k in d) {
    if(d[k] == val) return;
  }
  return "";
}

function byNameSub(d, name, nlist) {
  for(var k in d) {
    if(k == name) nlist.push(d);
    if(typeof d[k] === "object") byNameSub(d[k], name, nlist)
  }
  return {};
}

exports.getByName = function(d, name) {
  var nlist = [];
  byNameSub(d, name, nlist)
  return nlist;  
}

function byIdSub(d, idval) {
  var dret;
  /*
  for(var k in d) {
    if(k == "id" && d[k] == idval) return d;
  }
  */
  if(d["id"] == idval) return d;
  
  for(var k in d) {
    if(typeof d[k] === "object") {
        dret = byIdSub(d[k], idval)
        if("id" in dret) return dret;
      }
  }
  return {}
}

exports.getById = function(d, idval) {
  return byIdSub(d, idval);
}

exports.dSlice = function(ob, st, en) {
   var cl = {};
   var ctr = 0;
   var size = Object.keys(ob).length;
   if(st < 0) st+= size;
   if(en==undefined) en = size;
   if(en < 0) en+= size; 
   for(var k in ob)
   {
      ctr++;
      if(ctr <= st) continue;
      if(ctr > en) break;
      if(typeof(ob[k])=="object" && ob[k] != null) {
        cl[k] = this.clone(ob[k]);
        continue;
      }      
      cl[k] = ob[k];
   }
   return cl;
}

exports.dSplice = function(d, low, up, inserted) {
   var left = this.dSlice(d, 0, low);
   if(up == undefined)
    return left;
   var right = this.dSlice(d, up);
   var x = this.dCat(left, inserted);
   x = this.dCat(x, right);
   return x;
}


exports.dShift = function(d) {
  var val;
  for(var k in d) {
     val = d[k]
     delete d[k] 
     return val
  }
  return "";
}

exports.dUnshift = function(d, newkey, newval) {
  var cl={};
  for(var i in d) {
    cl[i]=d[i]; 
    delete d[i];
  }  
  d[newkey]=newval;
  for(var i in cl) {
    if(i == newkey) continue;
    d[i]=cl[i];
  }  
}

exports.dPop = function(d) {
  var k
  for(k in d) { ;}
  var val = d[k]
  delete d[k] 
  return val
}

// concat two objects: already existing properties values changed from added objects
exports.dCat = function(d1, d2) {
  var x = this.clone(d1)
  for(var k in d2) {
    x[k] = d2[k];
  }
  return x;
}

// return a dict of entries in d1 but not in d2
exports.dDiff = function(d1, d2) {
  var x = {};
  for(k in d1) { 
    if(!(k in d2)) 
      x[k] = d1[k]; 
  }
  return x;
}

exports.dUnique = function(d) {
  var nd = {};
  var temp = []
  for(var x in d) {
    if(temp.indexOf(x) != -1) continue;
    nd[x] = d[x];
    temp.push(x);
  }
  return  nd; 
}

exports.dLoad = function (d, fname) {
  a = fs.readFileSync(name).toString().split("\n");
  for(var x in d) delete x;
  for(var i = 0; i < a.length; i++) {
    var pair = a[i].split(":");
    d[ pair[0] ] = pair[1];
  }
}

exports.dStore = function (d, fname) {
  var data = "";
  for(var k in d) {
    data += k + ":" + d[k] + "\n"   
  }
  fs.writeFileSync(fname, data);
}

exports.dScan=function(d, fun)
{
  for(var k in d) fun(d[k]);
}

var XMLStorage = "";
function xmlSub(d, name) 
{
  var flag = true;
  for(var x in d)
  {
    if (d[x] instanceof Object || typeof d[x] == "object") {
      if(flag) XMLStorage += ">\n";
      XMLStorage += "<" + x;
      flag = xmlSub(d[x], x);
      if(flag)  XMLStorage += ">\n";
      XMLStorage += "</" + x + ">\n";
      flag = false;      
      continue;
    }  
    if (x == "data") { 
      XMLStorage += ">" + d[x] +"\n";
      flag = false;
    }  
    else { 
      XMLStorage += " " + x + "=\""+ d[x] + "\"";
      flag = true;
    }    
  }
  return flag;  
}

exports.toXML=function(d) 
{
  XMLStorage = '<?xml version="1.0"?>';
  if(xmlSub(d)) XMLStorage += ">\n";
  return XMLStorage;
}

// Dynamic variable

exports.isArray = function(x) {
  return typeof x === "array" || x instanceof Array;
}

exports.isObject = function(x) {
  return typeof x === "object" || x instanceof Object;
}

exports.isText = function(x) {
  return typeof x === "string" || x instanceof String;
}

exports.isNumber = function(x) {
  return typeof x === "number" || x instanceof Number;
}

exports.isBoolean = function(x) {
  return typeof x === "boolean" || x instanceof Boolean;
}



// Iterator

exports.$it = new function(data) 
{
  var index = 0;
  var nxt = function() {
    var x = data[index];
    index++;
    return x;
  }
  var pre = function() {
    var x = data[index];
    index--;
    return x;
  }
  var end = function() { index = data.length - 1; }
  var cur = function() { return data[index]; }
}


// Text

exports.STR_PAD_LEFT = 0;
exports.STR_PAD_RIGHT = 1;
exports.STR_PAD_BOTH = 2;

exports.pad=function(input, finalsize, padding, type) 
{
  if (typeof(padding) == "undefined") { var padding = ' '; }
  if (typeof(type) == "undefined") { var type = this.STR_PAD_RIGHT; }
  var left, right;  
  var padlen = finalsize - input.length;
  var multi = Math.ceil((padlen) / padding.length) + padding.length; 

  if (padlen > 0) {  
    padding = Array(multi).join(padding).slice(0, padlen);
    switch(type){
      case this.STR_PAD_LEFT:
        input = padding + input;
        break;
      case this.STR_PAD_BOTH:
        right = Math.ceil(padlen / 2);
        left = padlen - right;
        input = padding.slice(0, left) + input + padding.slice(0, right);
        break;      
      default: // right
        input = input + padding;
    }    
  }
  return input;
}

// File

var filePtr = {}
var fileBuffer = {}
var buffer = new Buffer(4096)

exports.fopen = function(path, mode) 
{
  if(mode.indexOf("r") != -1 && !fs.existsSync(path)) return false; 
  var handle = fs.openSync(path, mode);
  if(handle==false) return false;
  filePtr[handle] = 0;
  fileBuffer[handle]= [];
  return handle;
}

exports.fclose = function(handle) 
{    
  if (handle in filePtr) {
    delete filePtr[handle]
    delete fileBuffer[handle]
  }  
  return fs.closeSync(handle)
}

exports.fgets = function(handle)
{    
  if(fileBuffer[handle].length == 0) 
  {
    var pos = filePtr[handle]
    var br = fs.readSync(handle, buffer, 0, 4096, pos)
    if(br < 4096) {
      delete filePtr[handle]
      if(br == 0)  return false
    }
    var lst = buffer.slice(0, br).toString().split("\n")
    var minus = 0
    if(lst.length > 1) {
      var x = lst.pop()
      minus = x.length
    }   
    fileBuffer[handle] = lst  
    filePtr[handle] = pos + br - minus
  }
  return fileBuffer[handle].shift()       
}

exports.fputs = function(handle, data) 
{
  fs.writeSync(handle, data + "\n", null, 'utf8'); 
}

exports.die=function(message) {
  console.log(message)
  process.exit(1)
}

exports.eof = function(handle) {
  return (handle in filePtr) == false && (fileBuffer[handle].length == 0)  
}

exports.filetype = function(name) {
  var stats = fs.statSync(name);
  if(stats.isDirectory()) return "dir";
  if(stats.isFile()) return "file";
  if(stats.isSocket()) return "socket";
  return "unknown";
}

exports.filetime = function(name) {
  var stats = fs.statSync(name);
  return stats["atime"];
}

exports.filemtime = function(name) {
  var stats = fs.statSync(name);
  return stats["mtime"]; 
}

exports.filesize = function(name) {
  var stats = fs.statSync(name);
  return stats["size"];
}

exports.isDir = function(name) {
  var stats = fs.statSync(name);
  return stats.isFile();
}

exports.isFile = function(name) {
var stats = fs.statSync(name);
  return stats.isDirectory();
}

exports.dummy = function(x) {
  return;
}


// Reactive programming

exports.Reactol = (function()
{
  Reactol.prototype.add = function(x) {
    this.depend.push(x)  
  }
  Reactol.prototype.change = function(x) {
    for(var i in this.depend)
    {
      if(x != undefined) this.value = x;
      var d = this.depend[i]; 
      d.action();
      d.change();
      if('output' in d) d.output();      
    } 
  }
  function Reactol() { 
    this.depend=[]
    this.value=0
  }
  return Reactol;
})();

// System

/*
exports.exec = function(command) {
    var exe = require('child_process').exec;
    exe(command, function (error, stdout, stderr) { 
      console.log(stdout); 
      if(error != null) return false;
    } );
    return true;
};
*/

exports.exec = function(command) {
    var exe = require('child_process').execSync;
    var ret = exe(command);
    process.stdout.write(String(ret));
    return true;
};


/* $_extends comes from TypeScript */

exports.extends = this.$_extends || function (d, b) 
{
    for (var p in b) 
      if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { 
      this.constructor = d; 
    }
    __.prototype = b.prototype;
    d.prototype = new __();
};