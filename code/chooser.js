/* File Chooser
   File input replacement with path and default value
   for local use of JavaScript on the desktop.
   (c) 2012-2025 By Denis Sureau.
   
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

const { contextBridge, ipcRenderer } = require('electron');
const { dialog } = require('@electron/remote');
const path = require("path");


// event

ipcRenderer.on("message", (event, data) => {
     let jobj = JSON.parse(data);
     switch(jobj.type) {
      case 'dirinfo':  
        break;
      default:
        alertDialog(jobj.data);      
     }
});


function sendFromInterface(a) {
    ipcRenderer.send("interface", JSON.stringify(a));
}

function dotFlag() {
    return  config.Display.list[0].checkbox;
}

function fileButton(target, dragflag) {
  let filepath = currentpath[target];
	sendFromInterface( { 
    'command': 'getdir', 
    'path': filepath,         
    'target': target,
    'dot': dotFlag()  
  })
}

function pathJoin(path, filename) {
    let last = path.slice(-1);
    if(last != '/' && last != '\\')
        return path + "/" + filename;
    return path + filename;
}

function replaceFilename(path, name) {
  let lio = path.lastIndexOf("/");
  return path.slice(0, lio +1) + name;
}


/*
  Building the entry for a directory
*/  



function buildDir(pathname, target) {
	return "<div class='dir' data-name='" 
  + pathname 
  + "' onDblClick='chDir(\"" + pathname + "\",\"" + target + "\")' onClick='sel(event, this)' oncontextmenu='return dsel(this)'>"
  + "<span class='ficon'>&#128193;</span>" 
  + pathname 
  + "</div>";
}

/*
  Building the entry for a file
*/  

function buildLink(filepath, fname, panelid, timesize, filedate, ext) {
    filepath = filepath.replace(/\\/gi, '/');
    let sep = '/';
    if(filepath.slice(-1) == '/')   sep = '';
    let fpath = filepath + sep + fname;

    let img;
    switch(ext.toLowerCase()) {
    case 'gif':
    case 'jpg':
    case 'png':
    case 'jpeg':
    case 'ico': 
    case 'webp':             
          //img = "🗽";
          img = "&#x1F5BC;&#xFE0F;"
          break;
    case 'htm':
    case 'html':
    case 'php':
    case 'asp':
          img = '🌐';
          break;  
    case 'zip':
          img = '&#128217;';
          break;
    case 'exe':
    case 'jar':
    case 'bat':
          img = '&#9881;';
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
    case 'py':
    case 'rb':
    case 'sol':    
    case 'sql':
    case 'ts':    
          img = '&#127779;';
          break;
    case 'bin':
    case 'wasm':
    case 'dll':  
          img='&#129519;';
          break;
    case 'prj':
          img = '&#128455;';
          break;           
    case 'mpg':
    case 'mkv':      
          img='&#127902;'        
          break;
    case 'mp3':
          img='&#127900;'        
          break;          
    default:
          img = '&#128459;'
    }

  let balise =
      "<div class='file' " 
      + "data-name='" + fname + "' " 
      + "data-size='" + timesize + "' " 
      + "data-date='" + filedate + "' " 
      + "onDblClick='view(this, \"" + fpath + "\",\"" + panelid + "\")' " 
      + "onClick='sel(event, this)' " 
      + "oncontextmenu='return rsel(this)'>" 
      + "<span class='ficon'>" + img + "</span>" 
      + fname 
      + "<span class='timesize'>" + timesize + " " + filedate + "</span>" 
      + "</div>";

    return balise;
}


/*
 File Display
  Display a list of files and directories.
  Filtered to images.
  - Call build*Link on images.
  - Call build*Dir on directories.
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
  let ad = a[3];
  let bd = b[3];
  let astr = parseInt(ad.substr(6,4) + ad.substr(3, 2) + ad.substr(0, 2));
  let bstr = parseInt(bd.substr(6,4) + bd.substr(3, 2) + bd.substr(0, 2));
  if(astr < bstr) return -1;
  if(astr > bstr) return 1;
  return 0;
}

// Display list of files in lcontent or rcontent

function fileList(content, sortMode = 0) {
	let target = content.target;
	insidezip[target]=content.iszip;
	let d = document.getElementById(target);
	let extmask = content.extmask; 
	let filepath = content.path;
	let fpathid = target + "path";
	let fpath = document.getElementById(fpathid);
	fpath.value = filepath;
  
	let listid = target + "list";
	let dir = content.list;
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
	let page = "<div class='filechooser'><div class='flist' id='"+ listid +"' tabindex='0'>";
	let dirlist = "";
	let filelist ="";
	
	for(let i = 0; i < dir.length; i++) {
		let item = dir[i];
		let type = item[0];
		let name = item[1];

		if(type=='dir') {
			dirlist += buildDir(name, target); 
		}
		else {
			let timesize = item[2];
      let filedate = item[3];    
			let p = name.lastIndexOf('.');
			let ext = name.slice(p + 1);
			if(extmask && ext != extmask) continue; 
			filelist += buildLink(filepath, name, target, timesize, filedate, ext);
		}
	}
	
	page += dirlist + filelist + "</div></div>";
	d.innerHTML = page;

  let x;
  if(target=='lcontent')
    x=document.getElementById('lcontentlist');
  else
    x=document.getElementById('rcontentlist');

  x.onkeydown = function(evt) {
    keydownHandler(evt, target);
  }

  if(ChooserDrag[target])  setDrag(listid);

	if(elementToSelect != null) {
		if(elementToSelect == '*') setFirstSelected(target);
		else {
			chooserLastSelected = null;
			elementToSelect = getElementByName(elementToSelect, target);
			sel(elementToSelect);
		} 
	}     
	elementToSelect = null;
	elementToOffset = null;
  restorePreviousTop(target, x)
}


// set entries draggables

function setDrag(id) {
  let lid = document.getElementById(id);
  let follow = lid.firstChild;
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

// change dir 

var topLDir = []
var topLIndex = 0
var topLRow = 0
var topRDir = []
var topRIndex = 0
var topRRow = 0


function restorePreviousTop(target, parent) { 
  let container = parent.parentNode
  if(target == "lcontent") {
    container.scrollTop = topLRow;
  }
  else {
    container.scrollTop = topRRow;
  }  
}

function setTopDir(target) {
  if(target == "lcontent") {
    topLRow = 0
    topLIndex = 0
  }
  else {
    topRRow = 0
    topRIndex = 0
  }
}

function restoreScrollInstant(parent, savedScroll) {
    parent.style.scrollBehavior = "auto";
    requestAnimationFrame(() => {
        parent.scrollTop = savedScroll;
        requestAnimationFrame(() => {
            parent.style.scrollBehavior = "";
        });
    });
}


function setDirTopRow(path, target) {
  let parentId = target+ "list"
  let parent = document.getElementById(parentId)
  if(parent==null) return
  parent = parent.parentNode
  if(target == "lcontent") {
    if(path == "..") {
      topLIndex = Math.max(0, topLIndex - 1)
      topLRow = topLDir[topLIndex]
    }  
    else {
      topLDir[topLIndex] = parent.scrollTop
      topLIndex++;      
    }
  
  }
  else {
    if(path == "..") {
      topRIndex = Math.max(0, topRIndex - 1)
      topRRow = topRDir[topRIndex]
    }
    else {
      topRDir[topRIndex] = parent.scrollTop
      topRIndex++;  
    }
  }

}


function chDir(filepath, target) {    
	if((filepath.length > 8) && filepath.slice(0, 8) == "file:///") {
		filepath = filepath.slice(8);
  }  
  setDirTopRow(filepath, target)
 
	sendFromInterface({
      'file': 'code/chooser.js', 
      'command': 'chdir', 
      'path': filepath,
      'target': target,
      'dot' : dotFlag() 
  });
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
    let filename = getNameSelected(element);
    let archive = document.getElementById(panelid +'path').value; 
    sendFromInterface({'command': 'textinzip','archive': archive,'entryname': filename });    
    return;
  }   

  //filepath = replaceFilename(filepath, getNameSelected(element)); 

  let p = filepath.lastIndexOf('.');
	let ext = filepath.slice(p + 1);
  if(forcePage) ext ='';
  
  for(let cv in customview)  {
	  if(ext == cv)  {
		  let a = customview[cv];
		  a.params.filename = filepath;
		  a.params.path = getNameSelected(element);
		  a.params.target = panelid;
      sendFromInterface(a);
		  return;
	  }
  }
  
  filepath = noHTMLchars(filepath);
  let idx = panelid.charAt(0) == "l" ? 0 : 1;
  recentsAdd(idx, replaceFilename(filepath, ""))
  
  switch(ext.toLowerCase())  {
    case 'gif':
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'ico' :
    case 'webp':  
        sendFromInterface({ 'command': 'loadimage', 'path': filepath, 'target': panelid });
        break;
    case 'zip':
        sendFromInterface({ 'command': 'viewzip', 'path': filepath, 'target': panelid });
        break;
    case 'exe':
    case 'jar':
        sendFromInterface({ 'command': 'execute', 'filename': null, 'path': filepath,'target': panelid });
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
    case 'php':
        sendFromInterface({
          'command': 'viewtext',
          'path': filepath,
          'target': panelid,
          'ext': "php"
        });
        break;
    default:
     	if(filepath.slice(0, 5) != 'http:')
        filepath = "file:///" + filepath;
        sendFromInterface({'command': 'viewtext', 'path': filepath, 'target': panelid, 'ext': ext});
        break;    
  }  
        
}

/*
function nodeClear(node) {
  let child = node.firstChild;
  while(child) {
    child.className="file";
    child = child.nextSibling;
  }  
}
*/

function deselectAll(parent) {
	let child = parent.firstChild; // child of flist
	while(child) {
    if(child.className == 'entrybold') 	{
      child.className="file";  
	  }
		child = child.nextSibling;
	}  	  
}

var chooserLastSelected = null;

function setSelected(element) {
  let name = getNameSelected(element); 
  if(!name) return;
  if(name.charAt(0) == '.') return;
  element.className="entrybold";	    
}


function isSelected(element) {
  return element.className=="entrybold"; 
}


function selectRange(item1, item2) {
  let parent = item1.parentNode;
  let child = parent.firstChild;
  let started = false;
  let finished = false;

  while (child && !finished) {
    if (child === item1 || child === item2) {
      if (!started) {
        started = true;
      } 
      else {
        setSelected(child);
        finished = true;
        break;
      }
      setSelected(child);
    } 
    else if (started) {
      setSelected(child);
    }
    child = child.nextSibling;
  }
  chooserLastSelected = null;
}

function sel(evt, element) {
    let isCTRL  = evt.ctrlKey;
    let isSHIFT = evt.shiftKey;

    if (isSHIFT && chooserLastSelected != null) {
        selectRange(chooserLastSelected, element);
        chooserLastSelected = element;

        return;
    }

    if(isCTRL && element.classList.contains('entrybold')) {
      element.classList.remove('entrybold');
      element.classList.add('file');
      return;
    }

    if (!isCTRL) {
        deselectAll(element.parentNode);
    }

    setSelected(element);
    chooserLastSelected = element;
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
	let parent = element.parentNode.parentNode.parentNode; 
  return parent.id; 	
}

function getPointedContent(panelName) {
	let slist = getSelected(panelName);
	if(slist.length != 1) {
		alertDialog(slist.length + " selected. Select just one file or directory to rename, please.");
		return null;
	}
	return slist[0];
}

function edit(element) {
  let target = pointFile(element);
	let filename =  getNameSelected(element); 
	let a = { 'command': 'getContent', 'path': filename, 'target': target, 'inEditor' : false };
	sendFromInterface(a);
}

function openProject(element) {
  let target = pointFile(element);
	let filename =  getNameSelected(element);
	let a = { 'command': 'openPrj', 'name': filename, 'target': target };
	sendFromInterface(a);
}

function open(element, forcePage) {
    let isIExplorer = false || !!document.documentMode;
    let target = pointFile(element);
    let fpathid = target + "path";
    let fpath = document.getElementById(fpathid);
    filepath = fpath.value;
    let fname =  getNameSelected(element);
    if(!isIExplorer) {
        filepath = filepath.replace(/\\/gi, '/');
    }    
    let sep = '/';
    if(filepath.slice(-1) == '/') sep = '';
    if(filepath.slice(-1) == '\\') sep = '';
    fname = filepath + sep + fname;
    view(element, fname, target, forcePage);
}

window.alertDialog=alertDialog;

function alertDialog(message) {
  const diag = document.createElement("dialog");
  diag.className = "modal-dialog";
  diag.style.padding = "0";
  diag.style.border = "1px solid #999";
  diag.style.fontSize = "13px";

  diag.innerHTML = `
      <div class="modal-content">
        <div style="margin-bottom:16px;">&#128073; ${message}</div>
        <div style="text-align:right;">
          <button id="btnOk" class="blue" style="width:64px">OK</button>
        </div>
      </div>
  `;

  document.body.appendChild(diag);

  diag.addEventListener("cancel", e => e.preventDefault());
  diag.addEventListener("click", e => {
    if (e.target === diag) e.preventDefault();
  });

  diag.showModal();

  const btnOk = diag.querySelector("#btnOk");
  btnOk.onclick = () => diag.close();

  diag.addEventListener("keydown", evt => {
    evt.stopPropagation();
    if (evt.key === "Enter" || evt.key === "Escape") diag.close();
  });

  diag.onclose = () => {
    diag.remove();
    if (typeof editor !== 'undefined' && editor.focus) {
      editor.focus();
      if (editor.textInput) editor.textInput.focus();
    }
  };
}

function promptDialog(question, defval, cb) {
  const diag = document.createElement("dialog");
  diag.className = "modal-dialog";
  
  // Clean, readable template literal since XSS isn't a concern locally
  diag.innerHTML = `
    <div class="modal-content">
        <label for="modalInput" style="display:block; margin-bottom:10px; font-weight:bold;">${question}</label>
        <input type="text" id="modalInput" value="${defval}">
        <div class="modal-buttons" style="text-align:right;">
            <button id="btnCancel" class="gray">Cancel</button>
            <button id="btnOk" class="blue">OK</button>
        </div>
    </div>
  `;  

  document.body.appendChild(diag);

  const input = diag.querySelector('#modalInput');
  const btnOk = diag.querySelector('#btnOk');
  const btnCancel = diag.querySelector('#btnCancel');

  diag.showModal();
  input.focus();
  input.select();  

  // Single tracking flag to make sure cb() only fires once
  let completed = false;

  const submit = () => {
    if (completed) return;
    completed = true;
    cb(input.value);
    diag.close();
  };

  const cancel = () => {
    if (completed) return;
    completed = true;
    cb(false); 
    diag.close();
  };

  // Click Handlers
  btnOk.onclick = submit;
  btnCancel.onclick = cancel;

  diag.oncancel = (evt) => {
    evt.preventDefault(); 
    cancel();
  };

  const handleKeyDown = (evt) => {
    evt.stopPropagation();
    if (evt.key === "Enter") {
      evt.preventDefault();
      submit();
    }
  };
  input.addEventListener("keydown", handleKeyDown);

  // Absolute cleanup on close to prevent memory leaks
  diag.onclose = () => {
    input.removeEventListener("keydown", handleKeyDown);
    diag.remove();
    
    // Safety check in case 'editor' isn't initialized globally yet
    if (typeof editor !== 'undefined' && editor.focus) {
      editor.focus();
    }
  };
}



function confirmDialog(question, cb) {
  const diag = document.createElement("dialog");
  diag.className = "modal-dialog";
  
  // Clean, readable template literal since XSS isn't a concern locally
  diag.innerHTML = `
    <div class="modal-content">
        <label for="modalInput" style="display:block; margin-bottom:10px; font-weight:bold;">${question}</label>
        <div class="modal-buttons" style="text-align:right;">
            <button id="btnCancel" class="gray">Cancel</button>
            <button id="btnOk" class="blue">Confirm</button>
        </div>
    </div>
  `;  

  document.body.appendChild(diag);

  const btnOk = diag.querySelector('#btnOk');
  const btnCancel = diag.querySelector('#btnCancel');
  diag.showModal();

  const submit = () => {
    if (typeof cb === "function") cb(true);
    diag.close();
  };

  const cancel = () => {
    if (typeof cb === "function") cb(false);
    diag.close();
  };

  btnOk.onclick = submit;
  btnCancel.onclick = cancel;

  const handleKeyDown = (evt) => {
    evt.stopPropagation();
    if (evt.key === "Enter") {
      evt.preventDefault();
      submit();
    }
    if (evt.key === "Escape") {
      evt.preventDefault();
      cancel();
    }    
  };
  
  // Absolute cleanup on close to prevent memory leaks
  diag.onclose = () => {
    diag.remove();
    if (typeof editor !== 'undefined' && editor.focus) {
      editor.focus();
    }
  };
}

function winToUnix(p) {
  return p.replace(/\\/g, "/").toLowerCase();
}

function copyRename(element) {
    let oldname = getNameSelected(element);
    oldname = noHTMLchars(oldname);

    let dispname = clipBoardFn !== "" ? clipBoardFn : oldname;
    let tPath = pathJoin(currentpath['rcontent'], dispname)
    let sPath = pathJoin(currentpath['lcontent'], oldname)

    promptDialog("Copy under a new name:", tPath, function(answer) {
        if(answer == false) return;
        let targetname = noHTMLchars(answer);
        if(targetname == "") return;
        let a = { 
            command: 'copyrename',
            oldname: sPath,
            newname: targetname,
            sourcePanel: 'lcontent',
            targetPanel: 'rcontent',
            isDirectory: isDirectory(element)
        };

        sendFromInterface(a);
    });
}


function elementClip(element) {
    let oldname = getNameSelected(element);
    clipBoardFn = noHTMLchars(oldname);
    navigator.clipboard.writeText(oldname)
}


function rsel(element) {
  let x = document.getElementById('ctxmenu1');
  if(x) x.parentNode.removeChild(x); 
  
  let parent = element.parentNode; 
  let isImage=false;
  let isExecutable = false;
  let isZip = false;
  let ext = getNameSelected(element);
  let epos = ext.lastIndexOf('.');
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
    case 'ico':
    case 'tiff':
    case 'webp':  
      isImage = true;
      break;
    case 'zip':
      isZip = true;  
    default: 
      break
  }
 
  let d = document.createElement('div');
  parent.appendChild(d);
  
  d.id = 'ctxmenu1';
  d.className = 'ctxmenu';
  d.style.left = xMousePosition + "px";
  d.style.top = yMousePosition + "px";

  requestAnimationFrame(() => {
    const menuHeight = d.offsetHeight;
    const viewportHeight = window.innerHeight;

    if (yMousePosition + menuHeight > viewportHeight) {
        d.style.top = (viewportHeight - menuHeight - 10) + "px"; 
    }
  });  

  d.onmouseover = function(e) { 
    this.style.cursor = 'pointer'; 
  } 

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
  
  let p = document.createElement('p');
  p.onclick=function() { open(element, true) };
  p.setAttribute('class', 'ctxline');
  p.innerHTML = "View"; 
  d.appendChild(p);  
  
  if(isExecutable)  {
    let pe = document.createElement('p');
    pe.onclick=function() { run(element, true); };
    pe.setAttribute('class', 'ctxline');
    pe.innerHTML = "Run";    
    d.appendChild(pe);    
  }   
  
  if(isZip)  {
    let pe = document.createElement('p');
    pe.onclick=function() { keyUnzip(); };
    pe.setAttribute('class', 'ctxline');
    pe.innerHTML = "Unzip";    
    d.appendChild(pe);
  }   
    
  let p2 = document.createElement('p');
  p2.onclick=function() { edit(element) };  
  p2.setAttribute('class', 'ctxline');
  p2.innerHTML = "Edit"; 
  d.appendChild(p2);  

  let target = pointFile(element);
  
  let p3 = document.createElement('p');
  p3.onclick=function() { elementRename(element, target); };
  p3.setAttribute('class', 'ctxline');
  p3.innerHTML = "Rename"; 
  d.appendChild(p3);  

  if(target == 'lcontent')  {
	  let p = document.createElement('p');
	  d.appendChild(p);
	  p.onclick=function() { 
      copyRename(element) 
    };
	  p.setAttribute('class', 'ctxline');
	  p.innerHTML = "Copy/Rename"; 
  }

  let px = document.createElement('p');
  d.appendChild(px);
  px.onclick=function() { elementClip(element, target); };
  px.setAttribute('class', 'ctxline');
  px.innerHTML = "Clipboard"; 

  return false;
}

function openDir(element) {
  let target = pointFile(element);
  let dirname = getNameSelected(element);
  chDir(dirname, target);
}

function run(element) {
  let target = pointFile(element);
  let fname = getNameSelected(element);
	let a = { 'command': 'execute', 'target': target, 'filename': fname };  
  sendFromInterface(a); 
}


function dirinfo(element) {
  let target = pointFile(element);
  let fname = getNameSelected(element);
	let a = { 'command': 'dirinfo', 'target': target, 'filelist': [fname] };  
	sendFromInterface(a);
}

function dsel(element) {
  let x = document.getElementById('ctxmenu2');
  if(x) x.parentNode.removeChild(x); 
  let parent = element.parentNode; 

  let d = document.createElement('div');
  parent.appendChild(d);
  d.id = 'ctxmenu2';
  d.className = 'ctxmenu';
  d.style.left = xMousePosition + "px";
  d.style.top = yMousePosition + "px";

  requestAnimationFrame(() => {
    const menuHeight = d.offsetHeight;
    const viewportHeight = window.innerHeight;

    if (yMousePosition + menuHeight > viewportHeight) {
        d.style.top = (viewportHeight - menuHeight - 10) + "px"; 
    }
  });  

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
  
  let p = document.createElement('p');
  d.appendChild(p);
  p.onclick=function() { openDir(element) };
  p.setAttribute('class', 'ctxline');
  p.innerHTML = "Open";  
    
  let p2 = document.createElement('p');
  d.appendChild(p2);
  p2.onclick=function() { dirinfo(element) };  
  p2.setAttribute('class', 'ctxline');
  p2.innerHTML = "Informations"; 
  
  let p3 = document.createElement('p');
  d.appendChild(p3);
  p3.onclick=function() { elementRename(element, pointFile(element)); };
  p3.setAttribute('class', 'ctxline');
  p3.innerHTML = "Rename";   
  
  let target = pointFile(element);  
  if(target == 'lcontent')  {
    let p4 = document.createElement('p');
    d.appendChild(p4);
    p4.onclick=function() { copyRename(element) };
    p4.setAttribute('class', 'ctxline');
    p4.innerHTML = "Copy/Rename"; 
  }  
 
  return false;
}


/*
  getListSelected
  Select files in the list
*/  

function getListSelected(list) {
  let source = document.getElementById('lcontent');
  let parent = source.firstChild;	
	let child = parent.firstChild.firstChild; 
	  
  while(child) {
    if(child.filename in list) 
      child.className = 'entrybold';
    child = child.nextSibling;
  }  	  
  return list;
}


/*
  getSelected(panelname)
  Return the list of selected items in a panel
  Items are <div> tags
*/

function getSelected(src) {      
  let source = document.getElementById(src);
	let parent = source.firstChild;	
	let slist = new Array();
	let child = parent.firstChild.firstChild; 
	while(child) 	{
		if(child.className == 'entrybold') 	{
			slist.push(child);
		}
		child = child.nextSibling;
	}  	
	return slist;  
}


function setFirstSelected(target) {
  let panel = document.getElementById(target);
  let element = panel.firstChild.firstChild.firstChild;
  chooserLastSelected = null;
  sel(element);
}

/* Extract name of selected item as displayed */

function getNameSelected(item) {
  return item.dataset.name;
}

/* Get element from name in list */

function getElementByName(name, source) {
  let s = document.getElementById(source);
	let child = s.firstChild.firstChild.firstChild; // flist.filename
	while(child) 	{
		if(getNameSelected(child) == name)	return child;
  	child = child.nextSibling;
	}  	
	return null;  
}

/* check if directory from picture */

function isDirectory(item) {
    let span = item.firstChild;
    return span.innerHTML == '📁';
}

/*
  getSelectedNames(panelname)
  Return the list of selected filename or dirnames
*/

/*
function getSelectedNames(source) {  
  let namelist = new Array();
  let slist = getSelected(source);
	for(i = 0; i < slist.length; i++) {
      namelist.push(slist[i].dataset.name)
  }
	return namelist;    
}
*/

function getSelectedNames(src) {  
  let source = document.getElementById(src);
  let namelist = new Array();
	let parent = source.firstChild;	
	let slist = new Array();
	let child = parent.firstChild.firstChild; 
	while(child) 	{
    if(child.className == "entrybold")
      namelist.push(child.dataset.name)  
		child = child.nextSibling;
	}  	
  return namelist;    
}


/*
  getAllNames(panelname)
  Return the list of  filename or dirnames
*/

function getAllNames(src) {  
  let source = document.getElementById(src);
  let namelist = new Array();
	let parent = source.firstChild;	
	let slist = new Array();
	let child = parent.firstChild.firstChild; 
	while(child) 	{
    namelist.push(child.dataset.name)  
		child = child.nextSibling;
	}  	
  return namelist;    
}

/*
  selectToDelete(panelname)
  Cross files selected to be deleted
*/  

function selectToDelete(source) {
  let slist = getSelected(source);
	for(i = 0; i < slist.length; i++)	{
		let element = slist[i];
    element.style.backgroundColor = '#666';
    element.style.textDecoration = 'line-through';
    element.style.color = 'red';
	}
}


function merge(base, nf) {
  if(nf=='') return;
  if(base[-1]== '/' || base[-1]== '\\') base = base.slice(0, -1)      
  return base + "/" + nf;
}

/* 
  Compare directories
  File in source panel missing in target panel or changed are selected
*/

function compare(invertFlag) {  
    let total = 0;
    let sourcePanel;
    let targetPanel;

    if(invertFlag) {
      sourcePanel = 'rcontent'
      targetPanel = 'lcontent'
    }
    else {
      sourcePanel = 'lcontent'
      targetPanel = 'rcontent'
    }

    let tparent = document.getElementById(targetPanel).firstChild;
    let rchild = tparent.firstChild.firstChild;

    let rmap = new Map();

    while (rchild) {
        if (rchild.dataset && rchild.dataset.name) {
            let name = rchild.dataset.name;
            let isDir = rchild.querySelector(".ficon")?.textContent === "&#128193;";

            rmap.set(name, {
                size: Number(rchild.dataset.size || 0),
                date: Number(rchild.dataset.date || 0),
                isDir: isDir
            });
        }
        rchild = rchild.nextSibling;
    }

    let parent = document.getElementById(sourcePanel).firstChild;
    let child = parent.firstChild.firstChild; 

    while (child) {
        let newer = false;

        let filename = child.dataset.name;
        if (filename == ".." || filename == "") {
            child = child.nextSibling;
            continue;
        }

        let isDir = child.querySelector(".ficon")?.textContent === "📁";
        let rinfo = rmap.get(filename);

        if (!rinfo) {
            newer = true;
        } 
        else {
            if (!isDir) {
                let sizeL = Number(child.dataset.size || 0);
                let dateL = Number(child.dataset.date || 0);

                if (sizeL !== rinfo.size) newer = true;
                if (dateL < rinfo.date) newer = true;
            }
        }

        if (newer) {
            child.className = 'entrybold';
            total++;
        } 
        else {
            child.className = isDir ? "dir" : "file";
        }

        child = child.nextSibling;
    }    

    let s = ""; 
    if (total > 1) s = "s";
    const result = total + ' file' + s + ' updated or missing.';
    console.log(result);
}


var isCTRL = false;
var isSHIFT = false;

document.onkeydown = function(evt) {
    isCTRL  = evt.ctrlKey;
    isSHIFT = evt.shiftKey;
};

document.onkeyup = function(evt) {
    isCTRL  = evt.ctrlKey;
    isSHIFT = evt.shiftKey;
};


