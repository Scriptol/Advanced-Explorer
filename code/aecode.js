/* AECode, client side  code for Advanced Explorer
   (c) 2012-2020 Denis Sureau - License GPL 3 */

var leftpanel = document.getElementById("lpane");
var rightpanel = document.getElementById("rpane");
var currpanel = leftpanel;
var AExplorerDrag = {'lcontent': true, 'rcontent':false };
var AExplorerSort = {'lcontent': 0, 'rcontent':0 };
var AERoot = null;

function sameDir() {
  var l = document.getElementById('lcontentpath').value;
  var r = document.getElementById('rcontentpath').value;
  return(l == r);
}

function showNotification(jobj) {
	var action = jobj.action;
	var target = jobj.target;
	switch(action) 	{
   case 'update':
      if(sameDir()) {
          panelReload('lcontent');
          target = 'rcontent';
      }
			panelReload(target);
			break;
	 default:
	}
}

function socketConfirm(jo) {
	var answer = confirm(jo.question);
    switch(jo.command) {
    case "copyover":
        if(answer===true) {
        var a = { 'command': 'copyover', 'source': jo.path, 'target': jo.tpath };
	        sendFromInterface(a);
        }
        break;
    case "createdir":
      	if(answer===true) {
	        var a = { 'command': 'mkdir', 'target': jo.tpath, "dot": dotFlag() };
	        sendFromInterface(a);
	    };
        break;
    default:
         break;   
  }
}

function socketImage(jobj) {
  var store = document.getElementById('rcontent');
	var imagepath = jobj.path;
	var ext = jobj.ext.slice(1);
	var i = 2;
	switch(ext.toLowerCase()) {
		case "png": i = 0;break;
		case "gif": i = 1;break;
		default:
			ext = 'jpeg';
	}
  
  var inner = document.createElement('div');
  store.innerHTML ='';
  store.appendChild(inner);
  inner.className='divimage';

  //var canvas = document.createElement("iframe");
  //canvas.setAttribute("style", "border:none;");
  //canvas.setAttribute("scrolling", "no");  
  var canvas = document.createElement("canvas");
  canvas.setAttribute("id", "canvasid");
  canvas.onclick=function() { 
    var a = { 'command': 'viewtext', 'path': imagepath, 'target': 0, 'ext': ext};
    sendFromInterface(a);    
  };
  
  var image=new Image();

  image.onload=function() { 
    var w = image.width;
    var h = image.height;
    var cw = store.scrollWidth;
    var ch = store.scrollHeight;

    var scalew = 1;
    var scaleh = 1;
    var ow = w;
    var oh = h;

    var imgratio = h / w;
    var scnratio = ch / cw;

    if(imgratio > scnratio)  // to be aligned on height
    {
       if(h > ch) {
        scaleh = ch / h;
        scalew = scaleh;
        h = ch;
        w *= scalew;
      }   
    }
    else  // to be aligned on width
    {   
      if(w > cw) {     
        scalew = cw / ow;
        scaleh = scalew;
        w = cw;
        h = oh * scaleh;
      }   
    }


    //alert(scalew + ' ' + cw + "/" + w + "  " + scaleh + " " + ch + "/"+ h);
    if(h < ch)
    {
      var offseth = (ch - h) / 2;
      inner.style.marginTop = offseth + "px";
    }
    if(w < cw)
    {
      var offsetw = (cw - w) / 2;
      inner.style.marginLeft = offsetw + "px";
    }

    canvas.width = w;
    canvas.height = h;

    inner.style.width = w + 'px';
    inner.style.height = h + 'px';

    inner.appendChild(canvas);
    
    var context = canvas.getContext("2d");
    context.scale(scalew, scaleh);
    context.drawImage(image, 0, 0);
    var model = "";
    var focale = "";
    var zoom = "";
    var exposition = "";
    var iso = "";
    var ouverture = "";
    var pmode = "";

 
    var message = imagepath + ", " + ow + " x " + oh + " px";

    updateStatusBar(message);
    var exiff = true;
    EXIF.getData(image, function() {
      iso = EXIF.getTag(this, "ISOSpeedRatings");
      if(iso === undefined) {
        if(w < ow || h < oh)
        document.getElementById('status').innerHTML += ", resized to " + w.toFixed() + " x "+ h.toFixed();   
        exiff = false;
        return;     
      }
      model = EXIF.getTag(this, "Model");
      focale = EXIF.getTag(this, "FNumber");
      zoom = EXIF.getTag(this, "FocalLengthIn35mmFilm");
      if(zoom === undefined || zoom == 0)
        zoom = EXIF.getTag(this, "FocalLength");
      if(zoom === undefined) zoom = ""; 
        else zoom += "mm";       
      exposition = new Number(EXIF.getTag(this, "ExposureTime"));
      if(exposition < 1) {
        exposition = new String("1/" + parseInt(1/exposition))
      }
      
      pmode = EXIF.getTag(this, "ExposureProgram");
      if(pmode === undefined) pmode = "";
      else {
        switch(pmode) {
          case "Manual": break;
          case "Normal program": pmode = "Auto"; break;
          case "Aperture priority": pmode = "A"; break;
          case "Shutter priority": pmode = "S"; break;
          case "Not defined": pmode="";
            break;
          default:
            break;
        }  
      }
    });    
    if(!exiff) return;
    var exif = ` &nbsp;&nbsp;  - &nbsp;&nbsp;   ${model} &nbsp;&nbspF/${focale} &nbsp;&nbsp${zoom} &nbsp;&nbsp${exposition}s &nbsp;&nbspISO ${iso} &nbsp;&nbsp${pmode} `;
    document.getElementById('status').innerHTML += exif;
    return;
  };

	image.src = 'data:image/'+ext+';base64, ' + jobj.content;
	// using the file path does not work locally with Chrome
  //image.src = "file:///" + imagepath;
}

var leftFiles;
var leftDirs;
var leftSize;
var rightFiles;
var rightDirs;
var rightSize;

function processDirdata(jobj) {
  var target = jobj.target;
  fileList(jobj, AExplorerSort[target]);
  currentpath[target] = jobj.path;
}

function updateStatusBar(message) {
  if(message===undefined) message="";
  document.getElementById('status').innerHTML = message;
}

ipcRenderer.on('stats', (event, data) => {
  var jobj = JSON.parse(data);
  if(jobj.target == 'lcontent') {
     leftDirs = jobj.dirs;
     leftFiles = jobj.files;
     leftSize = jobj.size;
   }
   else {
     rightDirs = jobj.dirs;
     rightFiles = jobj.files;
     rightSize = jobj.size;
   }
  
   var lpd = leftDirs > 1 ? 's, ' : ', ';
   var lpf = leftFiles > 1 ? 's, ' : ', ';
   var rpd = rightDirs > 1 ? 's, ' : ', ';
   var rpf = rightFiles > 1 ? 's, ' : ', ';
        
   var stats = "<span class='lstats'>"
        + leftDirs + " dir" + lpd
        + leftFiles + " file" + lpf
        + leftSize + " bytes.</span><span class='rstats'>"
        + rightDirs + " dir" + rpd
        + rightFiles + " file" + rpf
        + rightSize + " bytes.</span>"; 
   updateStatusBar(stats);
}); 


ipcRenderer.on('interface', (event, data) => {
  var jobj = JSON.parse(data);
  switch(jobj.type) {
    case 'notification':
        showNotification(jobj);
        break;
    case 'confirm':
        socketConfirm(jobj);
        break;    
    case 'dirdata':
        processDirdata(jobj);
        break;   
    case 'editor':
        displayEditor(jobj, false);
        break;
    case 'message':
        alert(jobj.content); 
        break;    
    case 'status':
        updateStatusBar(jobj.content);
        break;    
    case 'image':
        socketImage(jobj);
        break; 
    case 'dirinfo':
        dialog.showMessageBoxSync({
          title:"Directory information on content",
          buttons: ["Ok"],
          message: jobj.content
        });
        //alert(jobj.content);
        break;
    case 'updateIni':
        eval(jobj.content);
        break;
    case 'mouse':
        var lp = document.getElementById('lcontent');
        if (lp.style) lp.style.cursor=jobj.pointer;
        var rp = document.getElementById('rcontent');
        if (rp.style) rp.style.cursor=jobj.pointer;
        break;
 
    case "boxapp":     
        boxApp(jobj);
        break;
  
    default:
        //alert("AECode Message '" + jobj.type + "' not handled here.");    
  }
});


/*
  Utilities
*/

function getExtension(filename)
{
  var p = filename.lastIndexOf('.');
  return filename.slice(p + 1);
}

function getCurrentDirectory(target)
{
  var panel = target + 'path';
  var path = document.getElementById(panel).value;
  var p = path.lastIndexOf('/');
  return path.slice(p + 1);
}

function setSortMode(panel, value) {
  AExplorerSort[panel] = value;
  var panelpath = panel + "path";
	var xid = document.getElementById(panelpath);
	var a = { 'command': 'godir', 'path': xid.value, 'target': panel };
	sendFromInterface(a);  
}

/*
  Context menus
*/

function addListMenu(element, panel) {
  var id = panel + "ctxm"; 
  var x = document.getElementById(id);
  if(x) x.parentNode.removeChild(x); 
  
  var parent = element.parentNode; 
  var d = document.createElement('div');
  parent.appendChild(d);
  
  d.id = id;
  d.className = 'ctxmenu';
  d.style.left = xMousePosition + "px";
  d.style.top = yMousePosition + "px";
  d.onmouseover = function(e) { this.style.cursor = 'pointer'; }; 
  d.onclick = function(e) { parent.removeChild(d);  };
  document.body.onclick = function(e) {
    try { parent.removeChild(d);}
    catch(e) {}   
  };
  
  var p = document.createElement('p');
  d.appendChild(p);
  p.onclick=function() { setSortMode(panel, 2); };
  p.setAttribute('class', 'ctxline');
  p.innerHTML = "Sort by dates"; 
  
  var p2 = document.createElement('p');
  d.appendChild(p2);
  p2.onclick=function() { setSortMode(panel, 1); };
  p2.setAttribute('class', 'ctxline');
  p2.innerHTML = "Sort by sizes"; 

  var p3 = document.createElement('p');
  d.appendChild(p3);
  p3.onclick=function() { setSortMode(panel, 0); };
  p3.setAttribute('class', 'ctxline');
  p3.innerHTML = "Sort by names"; 
  
}  

/* Data exchange file */

function buildXData(target) {
  var xdata = {};
  xdata['source']= {}
  xdata['target'] = {}  

  if(target == "lcontent") {
    xdata.source['path'] = document.getElementById("lcontentpath").value;
    xdata.source['list'] = getSelectedNames('lcontent');
    xdata.target['path'] = "";
    xdata.target['list'] = "";    
  }
  else {
    xdata.source['path'] = "";
    xdata.source['list'] = "";
    xdata.target['path'] = document.getElementById("rcontentpath").value;
    xdata.target['list'] = getSelectedNames('rcontent');
  }
  var a = { 
	      'command': 'store', 
				'filename': "xdata.js",
				'content' : "var xdata =" + JSON.stringify(xdata, " "),
        'target'  : target,
				'overwrite' : true 
  };
  sendFromInterface(a);
}

/*
	Top Events building
*/

var topInvert = function (target) {
	if(document.getElementById('dirpane').style.display=="none")	return;
	var x = document.getElementById('lcontentpath');
	var y = document.getElementById('rcontentpath');
	var a = { 'command': 'godir', 'path': x.value, 'target': 'rcontent' };
	sendFromInterface(a);

	var a = { 'command': 'godir', 'path': y.value, 'target': 'lcontent' };
	sendFromInterface(a);
}

var topDup = function (target) {
	if(document.getElementById('dirpane').style.display=="none")	return;
	var x = document.getElementById('lcontentpath');
	var a = { 'command': 'godir', 'path': x.value, 'target': 'rcontent' };
	sendFromInterface(a);
}


var topCopy = function () {
	if(document.getElementById('dirpane').style.display=="none")	return;
	var namelist = getSelectedNames('lcontent');
	if(namelist.length == 0) {
		alert("No dir/file selected in left panel");
		return;
	}
    if(insidezip['lcontent']) {
        keyUnzip()
        return;
    }
	var left = document.getElementById('lcontentpath').value;
	var right = document.getElementById('rcontentpath').value;
	if(left == right) {
		alert("Can't copy a file over itself!");
		return;
	}

	var a = { 'command': 'filecopy', 'list': namelist, 'source' : 'lcontent', 'target': 'rcontent'};
	sendFromInterface(a);
}

var topCopyRename = function() {
  var namelist = getSelected('lcontent');
	if(namelist.length != 1) {
	  alert("Select just one file to copy under a new name");
	  return;
	} 
  copyRename(namelist[0]);
}  

var topZip = function (target) {
	if(document.getElementById('dirpane').style.display=="none")	return;

	var namelist = getSelectedNames('lcontent');
	if(namelist.length == 0) {
		alert("No dir/file selected in left panel");
		return;
	}

	var zipname = document.getElementById("zip").value;
	if(zipname == null || zipname == '') return;
	var p = zipname.lastIndexOf(".");
	if(zipname.substr(p) != ".zip")	zipname += ".zip";

  var archiver = config.Archiver.input;

	var a = { 'command': 'archive', 
            'archiver': archiver,
            'zipname': zipname, 
            'list': namelist,
            'source' : 'lcontent',
            'target': 'rcontent' 
	};
	sendFromInterface(a);
}

var topSync = function (target) {
	if(document.getElementById('dirpane').style.display=="none")	return;
  
  var x = document.getElementById('syncframe');
  if(x) {
    x.id=null;
    panelReload('lcontent');
    return;
  }  
  
  var allFlag = false;
	var nameList = getSelectedNames('lcontent');
	if(nameList.length == 0) {
		allFlag = true; 
	}
  
  var lc = document.getElementById('lcontent');
  var d = document.createElement('iframe');
  d.src="synchronizer.html";   
  lc.removeChild(lc.firstChild);
  lc.appendChild(d);
  d.width = "100%";
  d.height = "100%";
  d.style.border = "0";
  d.id = 'syncframe';   

	var fcontent = (d.contentWindow || d.contentDocument);
	fcontent.sourcepath = document.getElementById('lcontentpath').value;
	fcontent.targetpath = document.getElementById('rcontentpath').value;
  fcontent.allFlag = allFlag;
  fcontent.nameList = nameList;
}


function displayEditor(data, fromTop) {               
  var dpane = document.getElementById('dirpane');
	var epane = document.getElementById('editpane');
	var edfra = document.getElementById('editor');
	var opane = document.getElementById('optpane');
	var framedit = document.getElementById("editor");
	var fc = (framedit.contentWindow || framedit.contentDocument);
	if(epane.style.display=="none")	{ 
    dpane.style.display = "none";
    opane.style.display = "none";
    epane.style.display = "block";
    edfra.style.display = "block";
    fc.display(data);
	}
	else // closing
	{
    epane.style.display = "none";
		edfra.style.display = "none";
		dpane.style.display = "block";
      if(fc.editor.getValue() != '') fc.editorIcon(true);
      fc.setActiveRow();
  }
	return;
}

var topEdit = function() {
	  displayEditor({ 'content': null, 'filename': null } , true );
}

function updateIni() {
  var a = { 
      'command': 'updateIni',
      'path': 'aexplorer.ini.js', 
      'target': null  
  };
  sendFromInterface(a); 
}

var topSetup = function() {
	var dpane = document.getElementById('dirpane');
	var epane = document.getElementById('editpane');
	var opane = document.getElementById('optpane');

	if(opane.style.display=="none") {
    epane.style.display = "none";
		dpane.style.display = "none";
		opane.style.display = "block";

    var framed = document.getElementById("editor");
    var fc = (framed.contentWindow || framed.contentDocument);

    var frameopt = document.getElementById("options");
    var oc = (frameopt.contentWindow || frameopt.contentDocument);
    oc.iniSetup(config, 'aexplorer.ini.js');
    return;
	}

	opane.style.display = "none";
	dpane.style.display = "block";
  updateIni();
}

var topHelp = function (target) {
  var a = { 
        'command': 'viewtext',
        'path': 'https://www.scriptol.com/scripts/advanced-explorer-manual.php', 
        'target': null,
        'ext':'html'
  };
  sendFromInterface(a);
}

var topQuit = function (target) {
  exitExplorer();
}

/*
	Panel Events building
*/
var panelReload = function (target) {
	var a = { 'file': '', 'command': 'getdir', 'path': '.',  'target': target, 'dot': dotFlag()  };
  sendFromInterface(a);
}

var panelHome = function (target) {
  var panel = target + 'path';
  var c = document.getElementById(panel).value;
  var np = '/';
  if(c.length > 2)
    if(c.charAt(1) == ':') np = c.slice(0,3);

	var a = { 'file': '', 'command': 'chdir', 'path': np, 'target': target, "dot": dotFlag() };
	sendFromInterface(a);
}

var panelUp = function(target)
{
  if(insidezip[target])
  {
    panelReload(target);
    return;
  }
	var a = { 'file': '', 'command': 'dirup', 'path': '',  'target': target, "dot": dotFlag() };
	sendFromInterface(a);
}

var panelCreate = function(target) { 
	var newname = promptDialog("Name of the new folder:", '', function(answer) {
    var newname = noHTMLchars(answer);
    if(newname == null || newname == "") return;
    var a = { 'command': 'mkdir', 'target': target, "newname": newname, "dot": dotFlag() };
	  sendFromInterface(a);
  });
}

// check if a new name may be given
function alreadyInList(parent, name) {
	var child = parent.firstChild; // child of flist
	while(child) 	{
    if(getNameSelected(child) == name)  return true;
		child = child.nextSibling;
	}
  return false;
}


function acceptRename(oldname, newname, target) {
	var a = { 'command': 'rename', 'target': target, 'oldname': oldname, 'newname' : newname };
	sendFromInterface(a);
}

var elementRename = function(spanitem, panelName) {
	var saved = spanitem.innerHTML;
	var p1 = saved.indexOf('>');
	var p2 = saved.indexOf('<', p1);
    if(p2 == -1)
        p2 = saved.length;
	var oldname = saved.slice(p1 + 1, p2);
    oldname = noHTMLchars(oldname);

	var x = document.createElement("input");
	x.setAttribute('type', 'text');
	x.setAttribute('value', oldname);
	x.setAttribute('size', '40');

  x.onkeypress = function(evt) {
  evt.stopPropagation();
  var code = evt.keyCode || evt.which;
  if(code == 13) {
		var newname = x.value;
		if(newname) {
        if(alreadyInList(spanitem.parentNode, newname))  {
            alert("Name already used");
        }
        else {
				  acceptRename(oldname, newname, panelName);
				  saved = saved.slice(0, p1 + 1) + newname + saved.slice(p2);
        }
		}
		x.blur();
    }
    else
    if(evt.ctrlKey)
    switch(code)  {
      case 17: 	x.blur();
            break;
    }
	};

  x.onkeydown = function(evt) {
     evt.stopPropagation();
  }

	x.onblur = function(evt) {
		spanitem.innerHTML = saved;
	};
	spanitem.innerHTML = "";
	spanitem.appendChild(x);
	x.focus();
}

/*var panelRename = function(panelName) {
  spanitem = getPointedContent(panelName);
  elementRename(spanitem, panelName);
}*/

function panelFileInfo(target) {
	var slist = getSelectedNames(target);
	if(slist.length < 1) 	{
		target = 'rcontent';
		slist = getSelectedNames(target);
		if(slist.length < 1) {
			alert('File info: ' + slist.length + " selected. ");
			return;
		}
	}
	var a = { 'command': 'dirinfo', 'target': target, 'filelist': slist };
  sendFromInterface(a);
}


var panelDelete = function(target) {
	var namelist = getSelectedNames(target);

	if(namelist.length == 0) 	{
		alert("Nothing selected to delete");
		return;
	}
  selectToDelete(target);

	var message = "Delete ";
	if(namelist.length > 1)
		message += namelist.length + " files?";
	else
		message += namelist[0] + '?';
  setTimeout(function() {
	  if(window.confirm(message) == false)
	  {
		  panelReload(target);
		  return;
	  }

	  var a = { 'command': 'unlink', 'list': namelist, 'target': target };
	  sendFromInterface(a);
  }, 100);
}

function openBox(target) {   
  var letter = target.charAt(0).toUpperCase();
  var parent = window.document.getElementById(target);

  var box = document.createElement("iframe");
  box.width = "100%";
  box.height = "100%";
  box.setAttribute("style", "border:0;");
  box.setAttribute("sandbox" ,'allow-forms allow-popups allow-same-origin allow-scripts')
  box.id="Box" + letter;  
  if(document.getElementById(box.id) != null) return;

  box.src =__dirname + "/Box" + letter + "/box.html";
  parent.removeChild(parent.firstChild)
  parent.appendChild(box);
}

function boxApp(apath, target) {
  var parent = window.document.getElementById(target);
  var box = document.createElement("iframe");
  box.setAttribute("sandbox", "allow-forms allow-popups allow-pointer-lock allow-same-origin allow-scripts")
  box.setAttribute("style", "border:0;");
  box.width="100%"
  box.height="100%"
  box.id=""
  box.src = apath;   
  parent.removeChild(parent.firstChild)  
  parent.innerHTML = ""; 
  parent.appendChild(box)
}


var panelBox = function(target) {
  var id = target + "list";
  var check = document.getElementById(id);  // file list displayed?
  if(check != null)  buildXData(target);

  openBox(target)
}

var panelGo = function(target, x) {
	var a = { 'command': 'godir', 'path': x.value, 'target': target };
	sendFromInterface(a);
}


/*
  Recents directories
*/  

function bmSize(idx) {
  return config.Bookmarks.list[idx].select.length;
}

function recentsFind(idx, name)  {
    return config.Recdirs.list[idx].indexOf(name)
} 

function recentsAdd(idx, name) {
    if(config.Recdirs == null) {
      config.Recdirs = {};
      config.Recdirs.list=[];
      config.Recdirs.list[0]=[];
      config.Recdirs.list[1]=[];
    }
    else {
      if(recentsFind(idx, name) > -1) return;
    }
    var bms = bmSize(idx);
    if(bms >= 24)  return;   // full of bookmarks
    if(bms + config.Recdirs.list[idx].length >= 24) {
      config.Recdirs.list[idx].pop();
    }  
    config.Recdirs.list[idx].unshift(name)  
}

function recentsDelete(idx, name) {
    var r = config.Recdirs.list[idx]
    var i = r.indexOf(name)
    //alert(i + " " + name)
    if(i > -1)
      r.splice(i, 1)    
}

function recentsClear(idx) {
    Recdirs.list[idx]=[];
}
  

/*
  Bookmarks.
*/

function bookmarkDelete(idx, name) {
  var bm = config.Bookmarks.list[idx].select
  var tf = bm.indexOf(name)
  if(tf > -1)
    bm.splice(tf, 1)
}

function bmDel(element, code) {
  var n = element.nextSibling;
  var name = n.innerHTML;
  bookmarkDelete(code, name)
}

function bmToDel(element) {
  element.firstChild.style.color = "white"
}

function bmToSkip(element) {
  element.firstChild.style.color = "#333"
}

function openBM(element, code) {
  var letter = (code == 0 ? "l" : "r")
  var id = letter + "bm";
  var target = letter + "content";
  var d = document.getElementById(id);
  var dpath = element.getAttribute("alt")
  d.style.display="none"  
  chDir(dpath, target)
}

function closeBM(element) {
  element.style.display="none"  
}

function dispBookmarks(letter, bm) {
    var id = letter + "bm"
	  var d = document.getElementById(id);
    var code = (letter == "l" ? 0 : 1);
    var blist = ""
    var i;
	  for(i = 0; i < bm.length; i++) {
		  var item = bm[i];
      blist +=  "<p alt='" + item + "' onclick='openBM(this, "+ 
        code + ")'  onmouseover='bmToDel(this)' onmouseout='bmToSkip(this)'><span class='bmdel' onclick='bmDel(this,"+ 
        code+ ")'>x</span><span class='bmname'>" + 
        item + "</span></p>"
	  }

    // recents
    if(i < 25 && config.hasOwnProperty("Recdirs")) {
      blist += "<hr>"
      var r = config.Recdirs.list[code]
      for(var i = 0; i < r.length; i++) {
          blist +=  "<p alt='" + r[i] + "' onclick='openBM(this, "+ 
          code + ")'><span class='recname'>"  +r[i] + "</span></p>"
      }
    }
    //alert(blist)
	  d.innerHTML = blist;
    d.style.display="block"  
}


function computer(letter) {
  var idx = (letter == 'l') ? 0 : 1;
  var bm = config.Bookmarks.list[idx].select;
	dispBookmarks(letter, bm);
}

function bookmark(letter) {
  var idx = (letter == 'l') ? 0 : 1;
  var bm = config.Bookmarks.list[idx].select;
  if(bm.length > 25) {
    alert("Full!")
    return;
  }
  var tpath = letter + 'contentpath';
  tpath = document.getElementById(tpath).value;

  tpath = tpath.replace(/\\/gi, '/');
  if(tpath.substr(-1) != "/") tpath += "/"
  var already = bm.some(function(x) { return (x == tpath)} );
  if(!already) {
    recentsDelete(idx, tpath)
    bm.push(tpath);
  }
  var id = letter + 'star';
  var elem = document.getElementById(id);
  elem.src = "images/starlight.png";
  setTimeout(function() { elem.src="images/star.png"; }, 500);
}


// Keys

function keyScroll(code) {
  var element, temp, offset;
  if(chooserLastSelected == null) return;
  var par = chooserLastSelected.parentNode

  if(code == 37) {
    var c = par.id.charAt(0);
    var target = c + 'content';
    panelUp(target);
    elementToSelect = '*';
    return;
  }

  if(code == 38) {
    temp = chooserLastSelected.previousSibling;
    if(temp == null) return;
    element = temp.previousSibling;
    if(element == null) return;
    offset = element.offsetTop - par.parentNode.scrollTop;
    if(offset < 140 )
       par.parentNode.scrollTop -= 22;
  }
  if(code == 40) {
    element = chooserLastSelected.nextSibling;
    if(element==null) return;
    element = chooserLastSelected.nextSibling.nextSibling;
    if(element==null) return;

    var rect = par.parentNode.getBoundingClientRect();
    var localpos = element.offsetTop - par.parentNode.scrollTop;
    if(localpos + 22 > rect.bottom)
      par.parentNode.scrollTop += 22;
  }
  if(element != null) {
    if(!isSHIFT && !isCTRL) deselectAll(par);
    element.className = 'entrybold';
    chooserLastSelected = element;
  }
}

function keyUnzip() {
  var list = config.Unarchive.list;
  var overwrite = list[0].checkbox;
  var keepath = list[1].checkbox;

  var namelist = getSelectedNames('lcontent');
  if(insidezip['lcontent']) {
    var zipname = document.getElementById('lcontentpath').value;
   	if(namelist.length == 0) {
		  alert("Select files to extract in the left panel.");
    }
    
    var a = { 
     'command': 'extract',
     'archive': zipname,
     'filelist': namelist,
     'overwrite': overwrite,
     'keepath': keepath,
     'source': 'lcontent',
     'target': 'rcontent'  
    };
    sendFromInterface(a);
		return;
	}
  else 
  {
    zipname = namelist[0];
    var a = {  
     'command': 'unzip',
     'archive': zipname,
     'overwrite': overwrite,
     'keepath': keepath,
     'source': 'lcontent',
     'target':'rcontent' 
    };
    sendFromInterface(a);
  }
}


/*
  These key code bypass default handlers
*/

function passHandler(evt, code)
{
  switch(code)
  {
      case 37:
      case 38:
      case 40: keyScroll(code);   break;
      case 67: topCopy(); break;
      case 85: keyUnzip(); break;
      default: break;
  }
}

var keydownHandler = function(evt, code, target)
{
  //alert("keyInPanel " + code + " " + target);
  switch(code)
  {
    case 46:
      panelDelete(target);
      evt.stopPropagation();
      break;
    case 82:
      evt.keyCode = 0;
      evt.cancelBubble = true;
      break;
    default:
      break;
  }
  isCTRL = false;
  return false;
}

var keypressHandler = function(evt, code, target)
{
  switch(code)
  {
    case 9:  // ctrl-i
        panelFileInfo(target);
        break;
    case 13: // enter
        var element = getPointedContent(target);
        var filename =  getNameSelected(element);
        if(isDirectory(element))
        {
            elementToSelect = '*';
            chDir(filename, target);
        }
        else
            open(element, true);
        break;
    case 18: // ctrl-r
        evt.keyCode = 0;
        evt.cancelBubble = true;
        break;    
    case 19: // ctrl-s
        break;
    default:
        break;
  }
  isCTRL = false;
  return false;
}

// Forms in icons

function setVisible(id) {
    document.getElementById(id).setAttribute("class", "openForm");
}
    
function setHidden(id) {
    document.getElementById(id).setAttribute("class", "closeForm");
}  

// Dialog to save edits before replacing file or exit

function getFileNode(filename) {
    var fname = filename;    
    if(filename !="") {
        var pos = fname.lastIndexOf("/");
        if(pos == -1) pos = fname.lastIndexOf("\\");
        if(pos > 0) fname = fname.substr(pos + 1);
    }
    return fname;
}  
    
function AESaveDialog(cb) { 
  var framedit = document.getElementById("editor");
	var fc = (framedit.contentWindow || framedit.contentDocument);
	var temp = fc.editor.getValue();  
	if(temp.length > 0)	{  
        var sDialog = document.createElement("dialog")
        sDialog.id="sDialog"
        document.body.appendChild(sDialog)
        
        var sLabel = document.createElement("p")
        sLabel.innerHTML = "Save changes in " + getFileNode(fc.filename) + "?"
        sDialog.appendChild(sLabel)

        var menu = document.createElement("menu")
        sDialog.appendChild(menu)
        
        var b2 = document.createElement("button")
        b2.onclick=function() { sDialog.close(2) }
        b2.innerHTML="Save"
        menu.appendChild(b2)
        
        var b1 = document.createElement("button")
        b1.onclick=function() { sDialog.close(1) }
        b1.innerHTML="Do not save"
        menu.appendChild(b1)

        var b0 = document.createElement("button")
        b0.onclick=function() { sDialog.close(0) }
        b0.innerHTML="Cancel"
        menu.appendChild(b0)
        sDialog.showModal();
        
        sDialog.addEventListener('close', function(e) {
            var response = sDialog.returnValue;
            if(response == 0) {
                cb(false); 
                return;
            }
            if(response == 1) {
                fc.changedStatus(false); 
                cb(true); // do not save and continue
                return;    
            }
            dialog.showSaveDialog(null, {
                title:"Save current text",
                defaultPath: "file:///" + fc.filename,
                buttonLabel: "Save file and continue"
                }, 
                function(fpath) {
                    document.body.removeChild(sDialog)
                    if(fpath == undefined) {
                        cb(false)  // cancel
                        return;
                    }
                    fc.changedStatus(false);                 
                    fc.filename = fpath;
                    fc.save(false);
                    cb(true)
                    return;                
            });
        });    
    } 
}


// Listeners

function addKeyListEvents(target)
{
  var x;
  if(target=='lcontent')
    x=document.getElementById('lcontentlist');
  else
    x=document.getElementById('rcontentlist');

  x.onkeypress = function(evt) {
  	var code = evt.keyCode || evt.which;
    keypressHandler(evt, code, target);
  }

  x.onkeydown = function(evt) {
  	var code = evt.keyCode || evt.which;
    keydownHandler(evt, code, target);
  }
}


function addEvent(id, func, target)
{
  var x = document.getElementById(id);
  if (x.addEventListener)
    x.addEventListener('click', function() { func(target)}, false);
  else
    x.attachEvent('onclick', function() { func(target)});
}


function addInputEvent(id, func, target)
{
  var x = document.getElementById(id);
  if (x.addEventListener)
    x.addEventListener('change', function() { func(target, x)}, false);
  else
    x.attachEvent('onchange', function() { func(target, x)});

	x.onkeypress = function(evt) {
	var code = evt.keyCode || evt.which;
		if(code == 13 || code == 17) x.blur();
	};
}


function buildEvents()
{
	addEvent('tinvert', topInvert);
	addEvent('tdup', topDup);
	addEvent('tcopy', topCopy);
  addEvent('tcopyren', topCopyRename);
  addEvent('tsync', topSync);
	addEvent('tedit', topEdit);
  addEvent('topt', topSetup);
	addEvent('thelp', topHelp);
	addEvent('tquit', topQuit);

	addEvent('lreload', panelReload, 'lcontent');
	addEvent('lhome', panelHome, 'lcontent');
	addEvent('lup', panelUp, 'lcontent');
  addEvent('lcreate', panelCreate, 'lcontent');
	addEvent('ldel', panelDelete, 'lcontent');
  addEvent('lbox', panelBox, 'lcontent');

	addInputEvent('lcontentpath', panelGo, 'lcontent');

	addEvent('rreload', panelReload, 'rcontent');
	addEvent('rhome', panelHome, 'rcontent');
	addEvent('rup', panelUp, 'rcontent');
  addEvent('rcreate', panelCreate, 'rcontent');
	addEvent('rdel', panelDelete, 'rcontent');
  addEvent('rbox', panelBox, 'rcontent');

	addInputEvent('rcontentpath', panelGo, 'rcontent');

  // drag and drop events

  var darear = document.getElementById('rcontent');

  darear.addEventListener('dragenter', function(evnt) {
   if (evnt.preventDefault) evnt.preventDefault();
   return false;
  });

  darear.addEventListener('dragover', function(evnt) {
   if (evnt.preventDefault) evnt.preventDefault();
   evnt.dataTransfer.dropEffect = 'copy';
   return false;
  });

  darear.addEventListener('drop', function(evnt) {
    if (evnt.stopPropagation) evnt.stopPropagation();
    var x = evnt.dataTransfer.getData('text');
    topCopy();
    evnt.preventDefault(); // for Firefox
    return false;
  }, false);

}
