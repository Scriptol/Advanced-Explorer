/* File Chooser
   File input replacement with path and default value
   for local use of JavaScript on the desktop.
   (c) 2012-2020 By Denis Sureau.
   
   License LGPL 3.0.
   Free to use provided this copyright notice is not removed.

   Requires:
   - Node.js.
   - A IPC connection opened with the server.
   - The Explorer.js module.
*/


var currentpath = [];
var insidezip = [];
var elementToSelect = null;
var elementToOffset = null;
var ChooserDrag = null;
var clipBoardFn = "";

var customview = [];

const {ipcRenderer} = require('electron')
const {dialog} = require('electron').remote   

// event

ipcRenderer.on("message", (event, data) => {
     var jobj = JSON.parse(data);
     switch(jobj.type) {
      case 'dirinfo':  break;
      default:
        alert(jobj.data);      
     }
});


function sendFromInterface(a) {
    ipcRenderer.send("interface", JSON.stringify(a));
}

function dotFlag() {
    return  config.Display.list[0].checkbox;
}

function fileButton(target, dragflag) {
    var filepath = currentpath[target];
	var query = { 
        'command': 'getdir', 
        'path': filepath,         
        'target': target,
        'dot': dotFlag()  
    };  
    sendFromInterface(query)
}

function pathJoin(path, filename) {
    var last = path.slice(-1);
    if(last != '/' && last != '\\')
        return path + "/" + filename;
    return path + filename;
}

function replaceFilename(path, name) {
  var lio = path.lastIndexOf("/");
  return path.slice(0, lio +1) + name;
}

/*
  Building the entry for a storage unit
*/ 

function buildDrive(pathname, id) {
	var balise ="<div class='dir' onDblClick='chDir(\"" + pathname + "\",\"" + id + "\")' onClick='sel(this)' oncontextmenu='return dsel(this)'>";
  balise += '<img src="images/drive.png">';
	balise += pathname;
	balise += "</div>";
	return(balise);
}

/*
  Building the entry for a directory
*/  

function buildDir(pathname, id) {
	var balise ="<div class='dir' onDblClick='chDir(\"" + pathname + "\",\"" + id + "\")' onClick='sel(this)' oncontextmenu='return dsel(this)'>";
  balise += '<img src="images/dir.png">';
	balise += pathname;
	balise += "</div>";
	return(balise);
}

/*
  Building the entry for a file
*/  

function buildLink(filepath, fname, panelid, timesize, filedate, ext) {
    filepath = filepath.replace(/\\/gi, '/');
    var sep = '/';
    if(filepath.slice(-1) == '/')   sep = '';
    var fpath = filepath + sep + fname;
    var balise ="<div class='file' onDblClick='view(this, \"" + 
      fpath + "\",\"" + 
      panelid + "\")' onClick='sel(this)' oncontextmenu='return rsel(this)'>";
    
    var img;
    switch(ext.toLowerCase())
    {
    case 'gif':
    case 'jpg':
    case 'png':
    case 'jpeg':
          img = 'img.png';
          break;
    case 'htm':
    case 'html':
    case 'php':
    case 'asp':
          img = 'web.png';
          break;  
    case 'zip':
          img = 'zip.png';
          break;
    case 'exe':
    case 'jar':
          img = 'app.png';
          break; 
    case 'prj':
          img = 'prj.png';
          break; 
    case 'c':
    case 'cpp':
    case 'cs':
    case 'css':
    case 'h':    
    case 'hpp':
    case 'ini':    
    case 'java':    
    case 'jl':
    case 'js':
    case 'json':    
    case 'py':
    case 'rb':
    case 'sol':    
    case 'sql':
    case 'svg':
    case 'ts':    
    case 'xml': 
          img = 'code.png';
          break;
    default:
          img = 'doc.png'
    }

    balise += '<img src="images/' + img + '">'; 
    balise += fname;
    balise += '<span class="timesize">' + timesize + ' ' + filedate + '</span>'; 
    balise += '</div>';
    return(balise);
}



/* File Display
  Display a list of files and directories.
  Filtered to images.
  - Call buildLink on images.
  - Call buildDir on directories.
  
  Input: the id of the tag to store the list, 
  and the list as an array of name and the common path.

*/

function imageList(content) {
  var target = content.target;
	var d = document.getElementById(target);
	var filepath = content['path'];
	var dir = content['list'];
	var page = "<div class='filechooser'>";
	page += "<p class='path'>" + filepath + "</p>";
	page += "<div class='files'>";
	var dirlist = "";
	var filelist ="";
	for(var i = 0; i < dir.length; i++)	{
		var item = dir[i];
		var type = item[0];
		var name = item[1];

		if(type=='dir')	{
			dirlist += buildDir(name, target) + "<br>";
		}
		else {
      var timesize = item[2];     
			var p = name.lastIndexOf('.');
			var ext = name.slice(p + 1);
			switch(ext) {
  			case 'gif':
	   		case 'png':
		  	case 'jpg':
        case 'jpeg':
              break;
        default: continue;
			}
			filelist += buildLink(filepath, name, target, timesize, ext) + "<br>";      
		}
	}
	page += dirlist;
	page += filelist;
	page += "</div>";
	page += "</div>";
	d.innerHTML = page;
}

/*
  Displays a list of files and dirs.
  Called by the interface when a 'dirdata' event is received
  from the server.
*/

var SORT_BY_NAME = 0;
var SORT_BY_SIZE = 1;
var SORT_BY_DATE = 2;

function sortByName(a, b) {
  if(a[0] == 'dir' && b[0] != 'dir') return -1;
  if(b[0] == 'dir' && a[0] != 'dir') return 1;
  return a[1].localeCompare(b[1]);
}

function sortBySize(a, b) {
  if(a[0] == 'dir') { 
    if(b[0] == 'dir') return 0;
    return -1;
  }
  if(b[0] == 'dir') return 1;
  return parseInt(a[2]) - parseInt(b[2]);
}

function sortByDate(a, b) {
  if(a[0] == 'dir') { 
    if(b[0] == 'dir') return 0;
    return -1;
  }
  if(b[0] == 'dir') return 1;
  var ad = a[3];
  var bd = b[3];
  var astr = parseInt(ad.substr(6,4) + ad.substr(3, 2) + ad.substr(0, 2));
  var bstr = parseInt(bd.substr(6,4) + bd.substr(3, 2) + bd.substr(0, 2));
  if(astr < bstr) return -1;
  if(astr > bstr) return 1;
  return 0;
}

function fileList(content, sortMode = 0) {
	var target = content.target;
	insidezip[target]=content.iszip;
	var d = document.getElementById(target);
	var extmask = content.extmask; 
	var filepath = content.path;
	var fpathid = target + "path";
	var fpath = document.getElementById(fpathid);
	fpath.value = filepath;
  
	var listid = target + "list";
	var dir = content.list;
    switch(sortMode) {
    case SORT_BY_SIZE:
        dir.sort(sortBySize);
        break;
    case SORT_BY_DATE:
        dir.sort(sortByDate);
        break;  
    default: 
        dir.sort(sortByName);
        break;
    }
	var page = "<div class='filechooser'>";
	page += "<div class='flist' id='"+ listid +"' tabindex='0'>";
	var dirlist = "";
	var filelist ="";
	
	for(var i = 0; i < dir.length; i++) {
		var item = dir[i];
		var type = item[0];
		var name = item[1];

		if(type=='dir') {
			dirlist += buildDir(name, target) + "<br>";
		}
		else {
			var timesize = item[2];
            var filedate = item[3];    
			var p = name.lastIndexOf('.');
			var ext = name.slice(p + 1);
			if(extmask && ext != extmask) continue; 
			filelist += buildLink(filepath, name, target, timesize, filedate, ext) + "<br>";
		}
	}
	
	page += dirlist;
	page += filelist;
	page += "</div>";
	page += "</div>";
	d.innerHTML = page;

	addKeyListEvents(target);
    if(ChooserDrag[target])  setDrag(listid);

	if(elementToSelect != null) {
		if(elementToSelect == '*') setFirstSelected(target);
		else
		{
			chooserLastSelected = null;
			elementToSelect = getElementByName(elementToSelect, target);
			sel(elementToSelect);
		} 
	}     
	elementToSelect = null;
	elementToOffset = null;

	var currdiv = document.getElementById(listid);
	currdiv.focus();
}

// set entries draggables

function setDrag(id) {
    var lid = document.getElementById(id);
    var follow = lid.firstChild;
    follow.setAttribute('draggable', true);
    while(follow = follow.nextSibling) {
        follow.setAttribute('draggable', true);
        follow.addEventListener('dragstart', function(evnt) {
            evnt.dataTransfer.effectAllowed = 'copy';
            if(!isSelected(this)) {
                deselectAll(this.parentNode);
                setSelected(this);
            }  
            return false;
        }, false);    
    }   
    return;
}

// change dir called by the interface

function chDir(filepath, target) {    
	if(filepath.slice(0, 8) == "file:///") {
		filepath = filepath.slice(8);
    }  
 
	var a = {
    'file': 'code/chooser.js', 
    'command': 'chdir', 
    'path': filepath,
    'target': target,
    'dot' : dotFlag() 
    }
    sendFromInterface(a);
}

function unlocalize(filepath) {
 	if(filepath.slice(0, 8) == "file:///") return(filepath.slice(8));
  return(filepath);    
}      

function noHTMLchars(s) {
    s = s.replace(/&lt;/g, '<');
    s = s.replace(/&gt;/g, '>');
    s = s.replace(/&quot;/g, '"');
    s = s.replace(/&copy;/g, '©');
    return s.replace(/&amp;/g, '&');
}

function view(element, filepath, panelid, forcePage) {
  if(insidezip[panelid]) { // always displayed like a page
    var filename = getNameSelected(element);
    var archive = document.getElementById(panelid +'path').value; 
    var a = {  
         'command': 'textinzip',
         'archive': archive,
         'entryname': filename
    };
    sendFromInterface(a);    
    return;
  }   
  filepath = replaceFilename(filepath, getNameSelected(element));  
  var p = filepath.lastIndexOf('.');
	var ext = filepath.slice(p + 1);
  if(forcePage) ext ='';
  
  for(var cv in customview)  {
	 if(ext == cv)  {
		var a = customview[cv];
		a.params.filename = filepath;
		a.params.path = getNameSelected(element);
		a.params.target = panelid;
    sendFromInterface(a);
		return;
	 }
  }
  
  filepath = noHTMLchars(filepath);

  var idx = panelid.charAt(0) == "l" ? 0 : 1;
  recentsAdd(idx, replaceFilename(filepath, ""))
  
  switch(ext.toLowerCase())  {
    case 'gif':
    case 'png':
    case 'jpg':
    case 'jpeg':  
        var a = { 'command': 'loadimage', 'path': filepath, 'target': panelid };
        sendFromInterface(a);
        break;
    case 'zip':
        var a = { 'command': 'viewzip', 'path': filepath, 'target': panelid };
        sendFromInterface(a);
        break;
    case 'exe':
    case 'jar':
        var a = { 'command': 'execute', 'filename': null, 'path': filepath,'target': panelid };
        sendFromInterface(a);
        break;
    case 'prj':
    case 'c':
    case 'cpp':
    case 'cs':
    case 'css':
    case 'h':    
    case 'hpp':
    case 'ini':    
    case 'java':    
    case 'jl':
    case 'js': 
    case 'json':       
    case 'py':
    case 'rb':
    case 'sol':    
    case 'sql':
    case 'svg': 
    case 'ts':   
    case 'xml':    
     	  edit(element);
        break;      
    default:
     	if(filepath.slice(0, 5) != 'http:')
        filepath = "file:///" + filepath;
        var ext = filepath.substr(-4);
        if(ext.charAt(0) == ".") 
            ext = ext.substr(1)
        else 
            ext = "";
        var a = { 'command': 'viewtext', 'path': filepath, 'target': panelid, 'ext': ext};
        sendFromInterface(a);
        break;    
  }  
        
}

function nodeClear(node)
{
  var child = node.firstChild;
  while(child)
  {
    child.className="file";
    child = child.nextSibling;
  }  
}

function deselectAll(parent)
{
	var child = parent.firstChild; // child of flist
	while(child) {
        if(child.className == 'entrybold') 	{
            child.className="file";  
	    }
		child = child.nextSibling;
	}  	  
}

var chooserLastSelected = null;

function setSelected(element)
{
    var name = getNameSelected(element)
    if(name.charAt(0) == '.') return;
    element.className="entrybold";	     
}

function isSelected(element) {
    return element.className=="entrybold"; 
}

function selectRange(item1, item2) {
  var parent = item1.parentNode;
  var inRange = false;
  var skipFollowers = false;
  var counter = 0;
 	var child = parent.firstChild;  
	while(child) {
    if(child.className == 'dir' || child.className == 'file' || child.className=='entrybold')  {
      if(skipFollowers == false)  {
        if(item1==child)  {
          setSelected(child);
          inRange=true;
          counter++;
          if(counter==2) skipFollowers = true; 
		      child = child.nextSibling;        
          continue;
        }
        if(item2==child)  {
          setSelected(child);
          inRange=true;
          counter++;
          if(counter==2) skipFollowers = true;
		      child = child.nextSibling;        
          continue;
        }
        if(inRange) {
          setSelected(child);
		  child = child.nextSibling;        
          continue;
        }
      }
      if(child.className == 'entrybold')  {
            child.className="file";    
	    }
    }
	child = child.nextSibling;
	}  	  
  chooserLastSelected = null;
}

function sel(element)
{
  if(isSHIFT)  {
    if(chooserLastSelected != null)  {
      selectRange(chooserLastSelected, element);
      chooserLastSelected = null;
      isSHIFT = false;    
      return;
    }
  }

  if(element.className == 'entrybold' && !isSHIFT)  {
    element.className="file";
  }
  else  {
    if(!isCTRL) deselectAll(element.parentNode);
    setSelected(element); 
  }    
  chooserLastSelected = element;

  isSHIFT = false;
}

/*
  Context menu
*/  


var xMousePosition = 0;
var yMousePosition = 0;

document.onmousemove = function(e) {
  xMousePosition = e.clientX + window.pageXOffset;
  yMousePosition = e.clientY + window.pageYOffset;
};

function pointFile(element) {
  deselectAll(element.parentNode);
  setSelected(element);
	var parent = element.parentNode.parentNode.parentNode; 
  return parent.id; 	
}

function getPointedContent(panelName) {
	var slist = getSelected(panelName);
	if(slist.length != 1) {
		alert(slist.length + " selected. Select just one file or directory to rename, please.");
		return null;
	}
	return slist[0];
}

function edit(element) {
  var target = pointFile(element);
	var filename =  getNameSelected(element);
	var a = { 'command': 'getContent', 'path': filename, 'target': target, 'inEditor' : false };
	sendFromInterface(a);
}

function openProject(element) {
    var target = pointFile(element);
	var filename =  getNameSelected(element);
	var a = { 'command': 'openPrj', 'name': filename, 'target': target };
	sendFromInterface(a);
}

function open(element, forcePage) {
    var isIExplorer = false || !!document.documentMode;
    var target = pointFile(element);
    var fpathid = target + "path";
    var fpath = document.getElementById(fpathid);
    filepath = fpath.value;
    var fname =  getNameSelected(element);
    if(!isIExplorer) {
        filepath = filepath.replace(/\\/gi, '/');
    }    
    var sep = '/';
    if(filepath.slice(-1) == '/') sep = '';
    if(filepath.slice(-1) == '\\') sep = '';
    var fname = filepath + sep + fname;
    view(element, fname, target, forcePage);
}

function promptDialog(question, defval, cb) {
  var pDialog = document.getElementById('pDialog')

  var fe = function(e) {
      cb(pDialog.returnValue)
      pDialog.removeEventListener("close", fe)
      return false
  }

  document.getElementById("pLabel").innerHTML = question
  document.getElementById("pAnswer").value = defval
  var x = pDialog.showModal()
  pDialog.addEventListener('close', fe);
  document.onkeydown=function(e) {
      if([33,34,37,38,40].indexOf(e.keyCode)!=-1) {
          e.preventDefault();
          return false;
      }
  }
}

function copyRename(element) {
    var oldname = getNameSelected(element);
    oldname = noHTMLchars(oldname);
    var dispName = oldname;
    if(clipBoardFn != "")  dispName = clipBoardFn;
	  var newname = promptDialog("New name:", dispName, function(answer) {
        var newname = noHTMLchars(answer);
        if(newname == null || newname == "") return;
  
        var sourcepath = pathJoin(currentpath['lcontent'], oldname);
        var targetpath = pathJoin(currentpath['rcontent'], newname);
        if(sourcepath == targetpath) {
  	        alert("Can't copy a file over itself!");	
		      return;
        }
  
        var a = { 
            'command': 'copyrename', 
            'oldpath': sourcepath, 
            'newpath': targetpath,      
            'source' : 'lcontent', 
            'target' : 'rcontent',
            'isDirectory': isDirectory(element) 
	      };
	      sendFromInterface(a);	
    });
}

function elementClip(element) {
    var oldname = getNameSelected(element);
    clipBoardFn = noHTMLchars(oldname);
    navigator.clipboard.writeText(oldname)
}


function rsel(element) {
  var x = document.getElementById('ctxmenu1');
  if(x) x.parentNode.removeChild(x); 
  
  var parent = element.parentNode; 
  var isImage;
  var isExecutable = false;
  var isZip = false;
  var ext = getNameSelected(element);
  var epos = ext.lastIndexOf('.');
	ext = ext.slice(epos + 1);  
  switch(ext.toLowerCase())  {
    case 'exe':
    case 'jar':
      isExecutable = true;
      break;
    case 'gif':
    case 'png':
    case 'jpg':
    case 'jpeg':
      isImage = true;
      break;
    case 'zip':
      isZip = true;  
    default: isImage = false;
  }
 
  var d = document.createElement('div');
  parent.appendChild(d);
  
  d.id = 'ctxmenu1';
  d.className = 'ctxmenu';
  d.style.left = xMousePosition + "px";
  d.style.top = yMousePosition + "px";
  d.onmouseover = function(e) { this.style.cursor = 'pointer'; } 
  d.onmouseleave = function(e) { 
    this.style.display='none'; 
    parent.removeChild(d)
    return;
  }
  d.onclick = function(e) { parent.removeChild(d);  }
  document.body.onclick = function(e) {
    try { parent.removeChild(d);}
    catch(e) {}   
  }
  
  var p = document.createElement('p');
  d.appendChild(p);
  p.onclick=function() { open(element, true) };
  p.setAttribute('class', 'ctxline');
  p.innerHTML = "View"; 
  
  if(isExecutable)  {
    var pe = document.createElement('p');
    d.appendChild(pe);
    pe.onclick=function() { run(element, true); };
    pe.setAttribute('class', 'ctxline');
    pe.innerHTML = "Run";    
  }   
  
  if(isZip)  {
    var pe = document.createElement('p');
    d.appendChild(pe);
    pe.onclick=function() { keyUnzip(); };
    pe.setAttribute('class', 'ctxline');
    pe.innerHTML = "Unzip";    
  }   
    
  var p2 = document.createElement('p');
  d.appendChild(p2);
  p2.onclick=function() { edit(element) };  
  p2.setAttribute('class', 'ctxline');
  p2.innerHTML = "Edit"; 

  var target = pointFile(element);
  
  var p = document.createElement('p');
  d.appendChild(p);
  p.onclick=function() { elementRename(element, target); };
  p.setAttribute('class', 'ctxline');
  p.innerHTML = "Rename"; 

  if(target == 'lcontent')  {
	  var p = document.createElement('p');
	  d.appendChild(p);
	  p.onclick=function() { 
      copyRename(element) 
    };
	  p.setAttribute('class', 'ctxline');
	  p.innerHTML = "Copy/Rename"; 
  }

  var px = document.createElement('p');
  d.appendChild(px);
  px.onclick=function() { elementClip(element, target); };
  px.setAttribute('class', 'ctxline');
  px.innerHTML = "Clipboard"; 

  return false;
}

function openDir(element) {
  var target = pointFile(element);
  var dirname = getNameSelected(element);
  chDir(dirname, target, false);
}

function run(element) {
  var target = pointFile(element);
  var fname = getNameSelected(element);
	var a = { 'command': 'execute', 'target': target, 'filename': fname };  
  sendFromInterface(a); 
}


function dirinfo(element) {
  var target = pointFile(element);
  var fname = getNameSelected(element);
	var a = { 'command': 'dirinfo', 'target': target, 'filelist': [fname] };  
	sendFromInterface(a);
}

function dsel(element) {
  var x = document.getElementById('ctxmenu2');
  if(x) x.parentNode.removeChild(x); 
  var parent = element.parentNode; 

  var d = document.createElement('div');
  parent.appendChild(d);
  d.id = 'ctxmenu2';
  d.className = 'ctxmenu';
  d.style.left = xMousePosition + "px";
  d.style.top = yMousePosition + "px";
  d.onmouseover = function(e) { this.style.cursor = 'pointer'; } 
  d.onmouseleave = function(e) { 
    this.style.display='none'; 
    parent.removeChild(d)
    return;
  }
  d.onclick = function(e) { parent.removeChild(d);  }
  document.body.onclick = function(e) {
    try { parent.removeChild(d);}
    catch(e) {}   
  }
  
  var p = document.createElement('p');
  d.appendChild(p);
  p.onclick=function() { openDir(element) };
  p.setAttribute('class', 'ctxline');
  p.innerHTML = "Open";  
    
  var p2 = document.createElement('p');
  d.appendChild(p2);
  p2.onclick=function() { dirinfo(element) };  
  p2.setAttribute('class', 'ctxline');
  p2.innerHTML = "Informations"; 
  
  var p3 = document.createElement('p');
  d.appendChild(p3);
  p3.onclick=function() { elementRename(element, pointFile(element)); };
  p3.setAttribute('class', 'ctxline');
  p3.innerHTML = "Rename";   
  
  var target = pointFile(element);  
  if(target == 'lcontent')  {
    var p4 = document.createElement('p');
    d.appendChild(p4);
    p4.onclick=function() { copyRename(element) };
    p4.setAttribute('class', 'ctxline');
    p4.innerHTML = "Copy/Rename"; 
  }  
 
  return false;
}


/*
  getSelected(panelname)
  Return the list of selected items in a panel
  Items are <div> tags
*/

function getSelected(source) {      
  var source = document.getElementById(source);
	var parent = source.firstChild;	// chooser
	var slist = new Array();
	var child = parent.firstChild.firstChild; // flist.filename
	while(child) 	{
		if(child.className == 'entrybold') 	{
			slist.push(child);
		}
		child = child.nextSibling;
	}  	
	return slist;  
}

function setFirstSelected(target) {
  var panel = document.getElementById(target);
  var element = panel.firstChild.firstChild.firstChild;
  chooserLastSelected = null;
  sel(element);
}

/* Extract name of selected item as displayed */

function getNameSelected(item) {
    var data = item.innerHTML;
    var p = data.indexOf('>');
    var name = data.slice(p + 1);
    p = name.indexOf('<');
    if(p > 0)
      name = name.slice(0, p);
    return name;  
}

/* Get element from name in list */

function getElementByName(name, source) {
  var s = document.getElementById(source);
	var child = s.firstChild.firstChild.firstChild; // flist.filename
	while(child) 	{
		if(getNameSelected(child) == name)
			return child;
  	child = child.nextSibling;
	}  	
	return null;  
}

/* check if directory from picture */

function isDirectory(item) {
    var img = item.firstChild;
    return img.src.indexOf("dir.png") != -1;
}

/*
  getSelectedNames(panelname)
  Return the list of selected filename or dirnames
*/

function getSelectedNames(source) {  
  var namelist = new Array();
  var slist = getSelected(source);

	for(i = 0; i < slist.length; i++) {
    var elem = slist[i].innerHTML;
    var p = elem.indexOf('>');
    elem = elem.slice(p+1);
    p = elem.indexOf('<');
    if(p > 0)
      elem = elem.slice(0, p);
    if(elem=='') continue;      
    namelist.push(elem);
  }
  //alert("selection : " + namelist.join(' '));
	return namelist;    
}

/*
  selectToDelete(panelname)
  Cross files selected to be deleted
*/  

function selectToDelete(source) {
  var slist = getSelected(source);
	for(i = 0; i < slist.length; i++)	{
		var element = slist[i];
    element.style.backgroundColor = 'white';
    element.style.textDecoration = 'line-through';
    element.style.color = 'red';
	}
}

var isCTRL = false;
var isSHIFT = false;
document.onkeyup=function(evt) {
	if(!evt.ctrlKey) isCTRL=false;
    if(!evt.shiftKey) isSHIFT = false;
}

document.onkeydown=function(evt) {
  if(evt.shiftKey) isSHIFT = true;
              else isSHIFT = false;
  var code = (evt.keyCode || evt.which);
  switch(code)  {  
      case 13:
        return true;
      case 37: // left
      case 38: // up
      case 40: // down
        evt.preventDefault(); 
        evt.returnValue = false;     
        passHandler(evt, code);
        return true;    
  }
  
  if(evt.ctrlKey)   {
    isCTRL = true;
    switch(code)  {
      case 17: // ctrl key
        break;
		  case 67:  // ctrl-c
        evt.preventDefault();
        evt.returnValue = false;
        passHandler(evt, code);
        isCTRL = false;
        break;
      case 73: // ctrl-i
        break;  
      case 85: // ctrl-u
        evt.preventDefault();
        evt.returnValue = false;
        passHandler(evt, code);
        isCTRL = false;
        break;
      default:
        break;       
    }
    return true;
  }
  
  isCTRL = false;
  return true;
}

