/* AECode, client side  code for Advanced Explorer
   (c) 2012-2026 Denis Sureau - License GPL 3 */

var leftpanel = document.getElementById("lpane");
var rightpanel = document.getElementById("rpane");
var currpanel = leftpanel;
var AExplorerDrag = {'lcontent': true, 'rcontent':false };
var AExplorerSort = {'lcontent': 0, 'rcontent':0 };

function getLeftPath() {
  return document.getElementById('lcontentpath').value;
}

function getRightPath() {
	return document.getElementById('rcontentpath').value;  
}


function sameDir() {
  return(getLeftPath() == getRightPath());
}

let copyUpdateTimer = null;
let compareAfter = false
function showNotification(jobj) {
	switch(jobj.action) 	{ 

    case 'update': 
      const target = jobj.target;  
   
      if(sameDir()) {
          panelReload('lcontent');
          panelReload('rcontent');
          return;
      }
			panelReload(target);
			break;
    case 'differed':
      if (copyUpdateTimer) {
        clearTimeout(copyUpdateTimer);
      }
      copyUpdateTimer = setTimeout(function() { 
        panelReload('rcontent');
        copyUpdateTimer = null; 
      }, 1500);
  	 default:
	}
}

function socketConfirm(jo) {
	confirmDialog(jo.question, function(answer) {
    if(answer === false) return;
    switch(jo.command) {
      case "copyover":
	      sendFromInterface({ 'command': 'copyover', 'source': jo.path, 'target': jo.tpath });
        copyUpdateTimer = null
        break;
      case "createdir":
	      sendFromInterface({ 'command': 'mkdir', 'target': jo.tpath, "dot": dotFlag() });
        break;
      default:
        break;   
    }      
  });
}

function socketImage(jobj) {
  let store = document.getElementById('rcontent');
	let imagepath = jobj.path;
	let ext = jobj.ext.slice(1);
	let i = 2;
	switch(ext.toLowerCase()) {
		case "png": i = 0;break;
		case "gif": i = 1;break;
		default:
			ext = 'jpeg';
	}
  
  let inner = document.createElement('div');
  store.innerHTML ='';
  store.appendChild(inner);
  inner.className='divimage';

  let canvas = document.createElement("canvas");
  canvas.setAttribute("id", "canvasid");
  canvas.onclick=function() { 
    sendFromInterface({ 'command': 'viewtext', 'path': imagepath, 'target': 0, 'ext': ext});    
  };
  
  let image=new Image();

  image.onload=function() { 
    let w = image.width;
    let h = image.height;
    let cw = store.scrollWidth;
    let ch = store.scrollHeight;

    let scalew = 1;
    let scaleh = 1;
    let ow = w;
    let oh = h;

    let imgratio = h / w;
    let scnratio = ch / cw;

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

    
    if(h < ch)
    {
      let offseth = (ch - h) / 2;
      inner.style.marginTop = offseth + "px";
    }
    if(w < cw)
    {
      let offsetw = (cw - w) / 2;
      inner.style.marginLeft = offsetw + "px";
    }

    canvas.width = w;
    canvas.height = h;

    inner.style.width = w + 'px';
    inner.style.height = h + 'px';

    inner.appendChild(canvas);
    
    let context = canvas.getContext("2d");
    context.scale(scalew, scaleh);
    context.drawImage(image, 0, 0);
    let model = "";
    let focale = "";
    let zoom = "";
    let exposition = "";
    let iso = "";
    let ouverture = "";
    let pmode = "";
 
    let message = imagepath + ", " + ow + " x " + oh + " px";

    updateStatusBar(message);
    let exiff = true;
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
    let exif = ` &nbsp;&nbsp;  - &nbsp;&nbsp;   ${model} &nbsp;&nbspF/${focale} &nbsp;&nbsp${zoom} &nbsp;&nbsp${exposition}s &nbsp;&nbspISO ${iso} &nbsp;&nbsp${pmode} `;
    document.getElementById('status').innerHTML += exif;
    return;
  };

	image.src = 'data:image/'+ext+';base64, ' + jobj.content; 
}

var leftFiles;
var leftDirs;
var leftSize;
var rightFiles;
var rightDirs;
var rightSize;

function processDirdata(jobj) {
  const target = jobj.target;
  fileList(jobj, AExplorerSort[target]);
  currentpath[target] = jobj.path;

  if(compareAfter) {
    compare(true)
    compareAfter = false;
  }

}

function updateStatusBar(message) {
  if(message===undefined) message="";
  document.getElementById('status').innerHTML = message;
}

ipcRenderer.on('stats', (event, data) => {
  let jobj = JSON.parse(data);
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
  
   let lpd = leftDirs > 1 ? 's, ' : ', ';
   let lpf = leftFiles > 1 ? 's, ' : ', ';
   let rpd = rightDirs > 1 ? 's, ' : ', ';
   let rpf = rightFiles > 1 ? 's, ' : ', ';
        
   let stats = "<span class='lstats'>"
        + leftDirs + " dir" + lpd
        + leftFiles + " file" + lpf
        + leftSize + " bytes.</span><span class='rstats'>"
        + rightDirs + " dir" + rpd
        + rightFiles + " file" + rpf
        + rightSize + " bytes.</span>"; 
   updateStatusBar(stats);
}); 

ipcRenderer.on('computer' , (event, data) => {
  let jobj = JSON.parse(data);
  displayDrives(jobj.letter, jobj.drives)
});

ipcRenderer.on('interface', (event, data) => { 
  let jobj = JSON.parse(data);
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
        alertDialog(jobj.content); 
        break;    
    case 'status':
        updateStatusBar(jobj.content);
        break;
    case 'counter':
        syncDialog.updateCounter(jobj.content)
        break;
    case 'image': 
        socketImage(jobj);
        break; 
    case 'dirinfo':
        alertDialog("Size of selected elements : " + jobj.content); 
        break;
    case 'updateIni':
        eval(jobj.content);
        break;
    case 'mouse':
        let lp = document.getElementById('lcontent');
        if (lp.style) lp.style.cursor=jobj.pointer;
        let rp = document.getElementById('rcontent');
        if (rp.style) rp.style.cursor=jobj.pointer;
        break;
    case "orphan":  
        if(syncDialog == undefined) {
          console.error("syncDialog undefined");
          break;
        }
        if (typeof syncDialog.addFiles === "function") {
          syncDialog.addFiles(jobj.dir, jobj.list);
        } 
        else {
          console.error("syncDialog.addFiles() unknown !");
        }
        break;
    case "boxapp":     
        boxApp(jobj);
        break;
  
    default:
        
  }
});


/*
  Utilities
*/

function getExtension(filename) {
  let p = filename.lastIndexOf('.');
  return filename.slice(p + 1);
}

function getCurrentDirectory(target) {
  const panel = target + 'path';
  const path = document.getElementById(panel).value;
  const p = path.lastIndexOf('/');
  return path.slice(p + 1);
}

function setSortMode(panel, value) {
  AExplorerSort[panel] = value;
  const panelpath = panel + "path";
	const xid = document.getElementById(panelpath);
	const a = { 'command': 'godir', 'path': xid.value, 'target': panel };
	sendFromInterface(a);  
}

/*
  Context menus
*/

function addListMenu(element, panel) {
  let id = panel + "ctxm"; 
  let x = document.getElementById(id);
  if(x) x.parentNode.removeChild(x); 
  
  let parent = element.parentNode; 
  let d = document.createElement('div');
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
  
  let p = document.createElement('p');
  d.appendChild(p);
  p.onclick=function() { setSortMode(panel, 2); };
  p.setAttribute('class', 'ctxline');
  p.innerHTML = "Sort by dates"; 
  
  let p2 = document.createElement('p');
  d.appendChild(p2);
  p2.onclick=function() { setSortMode(panel, 1); };
  p2.setAttribute('class', 'ctxline');
  p2.innerHTML = "Sort by sizes"; 

  let p3 = document.createElement('p');
  d.appendChild(p3);
  p3.onclick=function() { setSortMode(panel, 0); };
  p3.setAttribute('class', 'ctxline');
  p3.innerHTML = "Sort by names"; 
  
}  

/* Data exchange file */

function buildXData(target) {
  let xdata = {};
  xdata['source']= {}
  xdata['target'] = {}  

  if(target == "lcontent") {
    xdata.source['path'] = document.getElementById("lcontentpath").value;
    xdata.source['list'] = getSelectedNames('lcontent');
    xdata.target['path'] = document.getElementById("rcontentpath").value;
    xdata.target['list'] = "";    
  }
  else {
    xdata.source['path'] = document.getElementById("lcontentpath").value;
    xdata.source['list'] = "";
    xdata.target['path'] = document.getElementById("rcontentpath").value;
    xdata.target['list'] = getSelectedNames('rcontent');
  }
  const a = { 
	      'command': 'store', 
				'filename': "xdata.js",
				'content' : "var xdata =" + JSON.stringify(xdata, " "),
        'target'  : target,
				'overwrite' : true 
  };
  sendFromInterface(a);
}



function dirSynchro() {
  if(document.getElementById('dirpane').style.display=="none")	return;
	let source = getLeftPath()
	let target = getRightPath()
	if(source == target) {
		alertDialog("Left and right panel must be differend directories!");
		return;
	}  

  if(insidezip['lcontent']) {
    alertDialog("Zip content no supported")
    return;
  }

  let namelist = getSelectedNames('lcontent');
	if(namelist.length == 0) {
    alertDialog("Up to date or empty directory, nothing to copy")
	}
  
	const a = { 'command': 'filecopy', 'list': namelist, 'source' : 'lcontent', 'target': 'rcontent'};
	sendFromInterface(a);
}


/* Synchro arborescente */


const syncDialog = {
    dialog: null,
    fileList: null,
    recursiveCheck: null,
    treePanel: null,

    init() {
        this.dialog = document.getElementById("syncDialog");
        this.fileList = document.getElementById("syncFileList");
        this.recursiveCheck = document.getElementById("syncRecursive");
        this.treePanel = document.getElementById("treeSyncPanel");
        this.updateCounter(0)

        document.getElementById("syncStart").addEventListener("click", () => {
            this.start();
        });

        document.getElementById("syncCancel").addEventListener("click", () => {
            this.hide();
        });

        document.getElementById("syncCheckAll").addEventListener("click", () => {
            this.checkAll();
        });

        document.getElementById("syncUncheckAll").addEventListener("click", () => {
            this.uncheckAll();
        });

        document.getElementById("syncDelete").addEventListener("click", () => {
            this.deleteSelected();
        });

        document.getElementById("syncCancelDelete").addEventListener("click", () => {
            this.hide();
        });

        this.recursiveCheck.addEventListener("change", () => {
          const recursive = this.recursiveCheck.checked;
          this.treePanel.style.display = recursive ? "block" : "none";
          this.dialog.style.height = recursive ? "480px" : "240px";
        });

    },
    show() {
        this.dialog.style.display = "flex";
        this.dialog.style.flexDirection = "column";
        const recursive = this.recursiveCheck.checked;

        if(recursive) {
          this.treePanel.style.display = "flex";  
          this.treePanel.style.flexDirection = "column";
          this.dialog.style.height = "480px";
        }
        else {
          this.dialog.style.height = "240px";
        }
        document.getElementById("syncSrcPath").innerHTML = getLeftPath();
        document.getElementById("syncTgtPath").innerHTML = getRightPath();
    },
    hide() {
        this.dialog.style.display = "none";
        this.fileList.innerHTML = "";
    },
    updateCounter(num) {
      document.getElementById("counter").innerHTML = num
    },

    addFiles(dir, files) { 
        const d = document.createElement("div");
        d.style.cssText = "padding: 3px 0;";
        d.innerHTML = `<p><u>${dir}</u></p>`;
        this.fileList.appendChild(d);

        files.forEach(fullPath => {
            const row = document.createElement("div");
            row.style.cssText = "padding: 3px 0;";
            row.innerHTML = `
                <input type="checkbox" class="syncFileCheck" checked data-file="${fullPath}">
                <span>${fullPath}</span>
            `;
            this.fileList.appendChild(row);
        });
    },

    checkAll() {
        document.querySelectorAll(".syncFileCheck").forEach(cb => cb.checked = true);
    },

    uncheckAll() {
        document.querySelectorAll(".syncFileCheck").forEach(cb => cb.checked = false);
    },

    getSelectedFiles() {
        return [...document.querySelectorAll(".syncFileCheck")]
            .filter(cb => cb.checked)
            .map(cb => cb.dataset.file);
    },

    start() {
        const l = getSelectedNames('lcontent').length
        if(l && l > 0) {
          alertDialog("Selection not allowed here. Use Copy instead")
          return;
        }
        const recursive = this.recursiveCheck.checked;
        if(!recursive) {
          compare(false); 
          compareAfter = true;
          dirSynchro(false);
          this.hide();
          document.getElementById('rcontentlist').focus();          
          return;
        }
        sendFromInterface({
            "command": "sync",
            "source": getLeftPath(),
            "target": getRightPath(),
            recursive
        })
    },

    deleteSelected() {
        const selectedFiles = this.getSelectedFiles();
        sendFromInterface({
            "command": "unlink",
            "list": selectedFiles,
            "target": "rcontent",
            "fullpath": true
        });
        this.hide();
    }
};





/*
	Top Events building
*/


function dirDisplayed() {
  return document.getElementById('dirpane').style.display=="none"
}

var topInvert = function () {
	if(document.getElementById('dirpane').style.display=="none")	return;
	const l = document.getElementById('lcontentpath');
	const r = document.getElementById('rcontentpath');
	const a = { 'file': '', 'command': 'getdir', 'path': l.value,  'target': 'rcontent', 'dot': dotFlag()  };
  sendFromInterface(a);
	const b = { 'file': '', 'command': 'getdir', 'path': r.value,  'target': 'lcontent', 'dot': dotFlag()  };
  sendFromInterface(b);
}

var panelReload = function (target) {
	let a = { 'file': '', 'command': 'getdir', 'path': '.',  'target': target, 'dot': dotFlag()  };
  sendFromInterface(a);
}

var topDup = function (target) {
	if(!dirDisplayed)	return;
	const l = document.getElementById('lcontentpath');
  const b = { 'file': '', 'command': 'getdir', 'path': l.value,  'target': 'rcontent', 'dot': dotFlag()  };  
	sendFromInterface(b);
}


var topCopyRename = function() {
  let namelist = getSelected('lcontent');
	if(namelist.length != 1) {
	  alertDialog("Select just one file to copy under a new name");
	  return;
	} 
  copyRename(namelist[0]);
}  

function checkSelected() {
  let namelist = getSelectedNames('lcontent');
	if(namelist.length == 0) {
		alertDialog("No dir/file selected in left panel");
		return false;
	}
  return true;
}

let zipName="";
var topZip = function (target) {
	let nameList = getSelectedNames('lcontent');
	if(nameList.length == 0) {
		alertDialog("No dir/file selected in left panel");
		return;
	}

  if(nameList.length == 1) {
    zipName = replaceExtension(nameList[0], ".zip")
  }

  promptDialog("Zip archive name:", zipName, function(answer) {
    if (answer === false || answer === null) return;
    zipName = noHTMLchars(answer.trim());
    if (zipName === "") return;

    let p = zipName.lastIndexOf(".");
    if (p === -1 || zipName.slice(p).toLowerCase() !== ".zip") {
        zipName += ".zip";
    }

    let a = {
        "command": "archive",
        "zipName": zipName,
        "list": nameList,
        "sourcePath": getLeftPath(),
        "targetPath": getRightPath()
    };

    sendFromInterface(a);
  });

}

function directorySync() {
    syncDialog.hide()
    compare(false); 
    compareAfter = true;
    dirSynchro(false);
    document.getElementById('rcontentlist').focus();
}

function treeSync() {
    socket.send(JSON.stringify({
        type: "SYNC_START",
        recursive,
        files: selectedFiles
    }));
}


function topSync() {
	if(!dirDisplayed)	return;
  syncDialog.show()
}

function displayEditor(data, fromTop) {               
  let dpane = document.getElementById('dirpane');
	let epane = document.getElementById('editpane');
	let edfra = document.getElementById('editor');
	let opane = document.getElementById('optpane');
	let framedit = document.getElementById("editor");
	let fc = (framedit.contentWindow || framedit.contentDocument);
	if(epane.style.display=="none")	{ 
    dpane.style.display = "none";
    opane.style.display = "none";
    epane.style.display = "block";
    edfra.style.display = "block";
    fc.display(data);
	}
	else 	{   // closing
    fc.setActiveRow();
    epane.style.display = "none";
		edfra.style.display = "none";
		dpane.style.display = "flex";

  }
	return;
}

var topEdit = function() {
	  displayEditor({ 'content': null, 'filename': null } , true );
}

function updateIni() {
  const a = { 
      'command': 'updateIni',
      'path': 'aexplorer.ini.js', 
      'target': null  
  };
  sendFromInterface(a); 
}

var topSetup = function() {
	const dpane = document.getElementById('dirpane');
	const epane = document.getElementById('editpane');
	const opane = document.getElementById('optpane');

	if(opane.style.display=="none") {
    epane.style.display = "none";
		dpane.style.display = "none";
		opane.style.display = "block";

    const framed = document.getElementById("editor");
    const fc = (framed.contentWindow || framed.contentDocument);

    const frameopt = document.getElementById("options");
    let oc = (frameopt.contentWindow || frameopt.contentDocument);
    oc.iniSetup(config, 'aexplorer.ini.js');
    return;
	}

	opane.style.display = "none";
	dpane.style.display = "block";
  updateIni();
}

var topHelp = function (target) {
  let a = { 
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


//	Panel Events building

var panelReload = function (target) {
	const a = { 'file': '', 'command': 'getdir', 'path': '.',  'target': target, 'dot': dotFlag()  };
  sendFromInterface(a);
}

var panelHome = function (target) {
  let panel = target + 'path';
  let c = document.getElementById(panel).value;
  let np = '/';
  if(c.length > 2)
    if(c.charAt(1) == ':') np = c.slice(0,3);

	let a = { 'file': '', 'command': 'chdir', 'path': np, 'target': target, "dot": dotFlag() };
	sendFromInterface(a);
}

var panelUp = function(target) {
  if(insidezip[target])  {
    panelReload(target);
    return;
  }
	const a = { 'file': '', 'command': 'dirup', 'path': '',  'target': target, "dot": dotFlag() };
	sendFromInterface(a);
}

var panelCreate = function(target) { 
	  promptDialog("Name of the new folder:", '', function(answer) {
    if(answer == false) return;
    let newname = noHTMLchars(answer);
    if(newname == "") return;
    const a = { 'command': 'mkdir', 'target': target, "newname": newname, "dot": dotFlag() };
	  sendFromInterface(a);
  });
}


var panelComp = function (target) { 
	if(document.getElementById('dirpane').style.display=="none")	return;
  const letter = target[0];
  compare(letter == "r"); 
  const l = letter + "contentlist"
  document.getElementById(l).focus();
}

var panelCopy = function (source) {
  if(document.getElementById('dirpane').style.display=="none")	return;
  const letter = source[0];
  let target = (letter == 'l') ? 'rcontent' : 'lcontent'
	if(sameDir()) {
		alertDialog("Left and right panel must be differend directories!");
		return;
	}  
  
	let namelist = getSelectedNames(source);
	if(namelist.length == 0) {
		alertDialog("No dir/file selected in source panel");
		return;
	}
  if(insidezip[source]) {
    keyUnzip(source)
    return;
  }

	const a = { 'command': 'filecopy', 'list': namelist, 'source' : source, 'target': target};
	sendFromInterface(a);
}


// check if a new name may be given
function alreadyInList(parent, name) {
	let child = parent.firstChild; // child of flist
	while(child) 	{
    if(getNameSelected(child) == name)  return true;
		child = child.nextSibling;
	}
  return false;
}


function acceptRename(oldname, newname, target) {
	sendFromInterface( { 
    'command': 'rename', 
    'target': target, 
    'oldname': oldname, 
    'newname' : newname 
  });
}


var elementRename = function(spanitem, panelName) {
  let saved = spanitem.innerHTML;
  let oldname = noHTMLchars(spanitem.dataset.name);

	promptDialog("Enter a new name :", `${oldname}`, function(answer) {
    if(answer === false) return
    let newname = noHTMLchars(answer);
    if(newname == "" || newname == oldname) return;
    if (alreadyInList(spanitem.parentNode, newname)) {
        alertDialog("Name already used");
        return;
    } 
    spanitem.dataset.name = newname;
    spanitem.innerHTML = saved.replace(oldname, newname)
    acceptRename(oldname, newname, panelName);    
  });  
} 


// Size of dir/selection

function panelFileInfo(target) { 
	let slist = getSelectedNames(target); 
	if(slist.length < 1) 	{
		target = 'rcontent';
		slist = getSelectedNames(target);
		if(slist.length < 1) {
			//alertDialog('File info: ' + slist.length + " selected. ");
			return;
		}
	}
	const a = { 'command': 'dirinfo', 'target': target, 'filelist': slist };
  sendFromInterface(a);
}


var panelDelete = function(target) {
	let namelist = getSelectedNames(target);

	if(namelist.length == 0) 	{
		alertDialog("Nothing selected to delete");
		return;
	}
  selectToDelete(target);

	let message = "Delete ";
	if(namelist.length > 1)
		message += namelist.length + " files?";
	else
		message += namelist[0] + '?';
	
  confirmDialog(message, function(answer) {
      if(answer !== false) {
        sendFromInterface({ 'command': 'unlink', 'list': namelist, 'target': target, 'fullpath': false });
      }
  });
	  
}

function openBox(target) {   
  let letter = target.charAt(0).toUpperCase();
  let parent = window.document.getElementById(target);

  let box = document.createElement("iframe");
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

function closeBox(target) {
    let letter = target.charAt(0).toUpperCase();
    let parent = window.document.getElementById(target);
    let boxId = "Box" + letter;
    let box = document.getElementById(boxId);
    if (!box) return;
    parent.removeChild(box);
}


function boxApp(apath, target) {
  const parent = document.getElementById(target);

  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }

  const box = document.createElement("iframe");
  box.setAttribute("sandbox", "allow-forms allow-popups allow-pointer-lock allow-same-origin allow-scripts");
  box.style.border = "0";
  box.width = "100%";
  box.height = "100%";
  box.src = apath;
  parent.appendChild(box);
}


function isBoxOpen(target) {
  const parent = document.getElementById(target);
  return parent.querySelector("iframe") !== null;
}

var panelBox = function(target) {
  if(isBoxOpen(target)) {
    panelReload(target);
    return;
  }  
  const id = target + "list";
  const check = document.getElementById(id); 
  if(check != null)  buildXData(target);
  openBox(target)
}

var panelGo = function(target, x) {
	const a = { 'command': 'godir', 'path': x.value, 'target': target };
	sendFromInterface(a);
}


//  Recents directories

function bmSize(idx) {
  try {
    return config.Bookmarks.list[idx].select.length;
  }
  catch(e) {
    return 0
  }
}

function recentsFind(idx, name)  {
    try {
      return config.Recdirs.list[idx].indexOf(name)
    }
    catch(e) {
      return -1
    }
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
    const bms = bmSize(idx);
    if(bms >= config.RECENTSMAX)  return;   // full of bookmarks
    if(bms + config.Recdirs.list[idx].length >= 24) {
      config.Recdirs.list[idx].pop();
    }  
    config.Recdirs.list[idx].unshift(name)  
}

function recentsDelete(idx, name) {
    let r = config.Recdirs.list[idx]
    let i = r.indexOf(name)
    if(i > -1)
      r.splice(i, 1)    
}

function recentsClear(idx) {
    Recdirs.list[idx]=[];
}
  
//  Bookmarks.

/*
function bookmarkDelete(idx, name) {
  try {
  let bm = config.Bookmarks.list[idx].select
  let tf = bm.indexOf(name)
  if(tf > -1)
    bm.splice(tf, 1)
  }
  catch(e) { }
}
*/

function openDir(element, code, popup) {
  let letter = (code == 0 ? "l" : "r")
  let target = letter + "content";
  let dpath = element.dataset.path;
  element.parentNode.remove()
  chDir(dpath, target)
}

function closeDrive(element) {
  element.style.display="none"  
}


function clearRecentList(code, popupId) {
    config.Recdirs.list[code] = [];
    const popup = document.getElementById(popupId);
    if (popup) popup.remove();
}

function fillRecents(popup, code) {
    let r = 0
    let blist = ""

    let i;    
    if(!config.hasOwnProperty("Recdirs")) return;
    try {
        r = config.Recdirs.list[code]
        for(let i = 0; i < Math.min(25, r.length); i++) {
          blist +=  "<p class='recent-item'" 
          + " data-path='" + r[i] + "'"
          + " onclick='openDir(this, " + code + ")'>"
          + r[i] 
          + "</p>"
        }
    }
    catch(e) {   }

    if (r.length > 0) {
    blist += `
        <div class="recent-footer">
            <button class="recent-clear-btn"
                    onclick="clearRecentList(${code}, 'recentPopup')">
                 Clear
            </button>
        </div>
    `;
}

    popup.innerHTML = blist;
}

function toggleRecentList(arrow) {
    const code = Number(arrow.dataset.code);
    const input = arrow.previousElementSibling; // l’input juste avant la flèche

    const old = document.getElementById("recentPopup");
    if (old) {
        old.remove();
        return;
    }

    const popup = document.createElement("div");
    popup.id = "recentPopup";
    popup.className = "recent-popup";

    const rect = input.getBoundingClientRect();
    popup.style.left = rect.left + "px";
    popup.style.top = rect.bottom + "px";
    popup.style.width = rect.width + "px";

    fillRecents(popup, code);

    popup.addEventListener("mouseleave", () => popup.remove());
    document.body.appendChild(popup);
    setTimeout(() => {
        document.addEventListener("click", closeRecentOnOutsideClick, { once: true });
    }, 0);
}

function closeRecentOnOutsideClick(e) {
    const popup = document.getElementById("recentPopup");
    if (!popup) return;

    if (!popup.contains(e.target)) {
        popup.remove();
    }
}


function changeDirectory(element, code) {
  let letter = (code == 0 ? "l" : "r")
  let target = letter + "content";
  let dpath = element.dataset.path;
  element.parentNode.remove()
  chDir(dpath, target)
}

function displayDrives(letter, dlist) {
    let id = letter + "bm"
	  let d = document.getElementById(id);
    if (!d) return;
    let code = (letter == "l" ? 0 : 1);
    let blist = ""
    let i;
	  for(i = 0; i < dlist.length; i++) {
      let path = dlist[i]
		  let item = dlist[i]
      blist +=  "<p data-path='" + path 
        + "' onclick='changeDirectory(this, " 
        + code 
        + ")'><span class='drive-item'><span class='icodsk'>&#128436;</span>"
        + "<span class='bmname'>"+ item + "</span></span></p>"
	  }
  
	  d.innerHTML = blist;
    d.style.display="block"  

    d.onmouseleave = () => {
        d.style.display = "none";
    };    
}


function computer(letter) {
  let id = letter + "bm"
	let d = document.getElementById(id);
  if (!d) return;
  if (getComputedStyle(d).display === "block")   {
      d.style.display = "none"
      return;  
  }
  const a = {
    "command":"getdrivelist",
    "letter": letter
  }
 
  sendFromInterface(a)
}


function bookmark(letter) {
  let idx = (letter === 'l') ? 0 : 1;
  let bm;

  try {
    bm = config.Recdirs.list[idx];
    if (!Array.isArray(bm)) {
      bm = config.Recdirs.list[idx] = [];
    }
    if (bm.length > 24) {
      bm.pop();
    }
  } catch (e) {
    bm = config.Recdirs.list[idx] = [];
  }

  let tpath = letter + 'contentpath';
  tpath = document.getElementById(tpath).value;
  tpath = tpath.replace(/\\/g, '/');
  if (!tpath.endsWith("/")) tpath += "/";

  if (!bm.includes(tpath)) {
    bm.unshift(tpath);
  }

  let star = document.getElementById(letter + "star");
  star.classList.add("active");
  setTimeout(() => star.classList.remove("active"), 500);  
}



// Keys

function keyScroll(evt) {
  let code = evt.code;
  let isSHIFT = evt.shiftKey;
  let isCTRL =  evt.ctrlKey;
  let element = null
  let temp
  let offset;
  
  if(chooserLastSelected == null) return;
  let par = chooserLastSelected.parentNode

  if(code == "ArrowLeft") {
    let c = par.id.charAt(0);
    let target = c + 'content';
    panelUp(target);
    elementToSelect = '*';
    return;
  }
  else if(code == "ArrowUp") {
    element = chooserLastSelected.previousSibling;
    if(element == null) return;
    offset = element.offsetTop - par.parentNode.scrollTop;
    if(offset < 140 )
       par.parentNode.scrollTop -= 22;
  }  
  else if(code == "ArrowDown") {
    element = chooserLastSelected.nextSibling;
    if(element==null) return;

    let rect = par.parentNode.getBoundingClientRect();
    let localpos = element.offsetTop - par.parentNode.scrollTop;
    if(localpos + 22 > rect.bottom)
      par.parentNode.scrollTop += 22;
  }

  if(element != null) {
    if(!isSHIFT && !isCTRL) deselectAll(par);
    element.className = 'entrybold';
    chooserLastSelected = element;
  }
}

function keyUnzip(source) {
  let list = config.Unarchive.list;
  let overwrite = list[0].checkbox;
  let keepath = list[1].checkbox;
  const letter = source[0]
  const target = (letter == 'l') ? "rcontent" : "lcontent"

  let namelist = getSelectedNames(source);
  let command;
  let zipname;
  if(insidezip[source]) {
    zipname = document.getElementById(letter + 'contentpath').value;
   	if(namelist.length == 0) {
		  alertDialog("Select files to extract in the other panel.");
    }
    command = "extract"
  }
  else {
    zipname = namelist[0];
    command = "unzip"
  }  
    
  const a = { 
    'command': command,
    'archive': zipname,
    'filelist': namelist,
    'overwrite': overwrite,
    'keepath': keepath,
    'source': source,
    'target': target  
  };
  sendFromInterface(a);
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
    let fname = filename;    
    if(filename !="") {
        let pos = fname.lastIndexOf("/");
        if(pos == -1) pos = fname.lastIndexOf("\\");
        if(pos > 0) fname = fname.substr(pos + 1);
    }
    return fname;
}  
    
function AESaveDialog(cb) { 
  let framedit = document.getElementById("editor");
	let fc = (framedit.contentWindow || framedit.contentDocument);
	let temp = fc.editor.getValue();  
	if(temp.length > 0)	{  
        let sDialog = document.createElement("dialog")
        sDialog.id="sDialog"
        document.body.appendChild(sDialog)
        
        let sLabel = document.createElement("p")
        sLabel.innerHTML = "Save changes in " + getFileNode(fc.filename) + "?"
        sDialog.appendChild(sLabel)

        let menu = document.createElement("menu")
        sDialog.appendChild(menu)
        
        let b2 = document.createElement("button")
        b2.onclick=function() { sDialog.close(2) }
        b2.innerHTML="Save"
        menu.appendChild(b2)
        
        let b1 = document.createElement("button")
        b1.onclick=function() { sDialog.close(1) }
        b1.innerHTML="Do not save"
        menu.appendChild(b1)

        let b0 = document.createElement("button")
        b0.onclick=function() { sDialog.close(0) }
        b0.innerHTML="Cancel"
        menu.appendChild(b0)
        sDialog.showModal();
        
        sDialog.addEventListener('close', function(e) {
            let response = sDialog.returnValue;
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


//  Key down handling in list of files. Target is the left or right panel.

var keydownHandler = function(evt, target) { 
  if (evt.target.tagName === 'INPUT' || 
      evt.target.tagName === 'TEXTAREA' || 
      evt.target.isContentEditable) {
    return; 
  }

  switch(evt.code)  {
    case "ArrowLeft":
    case "ArrowUp":
    case "ArrowDown":
        evt.preventDefault();
        keyScroll(evt);   
        break;    
    case "ControlLeft":
    case "ControlRight":
        break;  
    case "Delete": // key delete
        panelDelete(target);
        evt.stopPropagation();  
        break;
    case "KeyN":  // ctrl-n rename
        if(!evt.ctrlKey) break;
        var namelist = getSelected(target);
	      if(namelist.length != 1) {
	        alertDialog("Select only one file to rename");
	        break;
	      }         
        elementRename(namelist[0], target);
        evt.stopPropagation();  
        break;        
    case "KeyI":  // ctrl-i show dir info
        if(!evt.ctrlKey) break;
        panelFileInfo(target);
        evt.stopPropagation();  
        break;
    case "KeyU":  // unzip      
        if(!evt.ctrlKey) break;
        keyUnzip(target)
        evt.stopPropagation();
        break;
    case "KeyC"    : // copy
        if(!evt.ctrlKey) break;
        if(target == "lcontent") {
          panelCopy(target);
        }  
        else {
          panelCopy("rcontent");
        }
        evt.stopPropagation();
        break;    
    case "Enter": // enter
        let element = getPointedContent(target);
        let filename = getNameSelected(element);
        if(isDirectory(element))  {
            elementToSelect = '*';
            chDir(filename, target);
        }
        else
            open(element, true);
        evt.stopPropagation();  
        break;
    default:
        break;
  }
  return false;
}

function addEvent(id, func, target) {
  const x = document.getElementById(id);
  if (x.addEventListener)
    x.addEventListener('click', function() { func(target)}, false);
  else
    x.attachEvent('onclick', function() { func(target)});
}


function addInputEvent(id, func, target) {
  const x = document.getElementById(id);
  if (x.addEventListener)
    x.addEventListener('change', function() { func(target, x)}, false);
  else
    x.attachEvent('onchange', function() { func(target, x)});

	x.onkeydown = function(evt) {
			if(evt.code == "Enter" || evt.code == "Escape") x.blur();
	};
}

function buildEvents() {  
	addEvent('tinvert', topInvert);
	addEvent('tdup', topDup);
  addEvent('tcopyren', topCopyRename);
  addEvent('tsync', topSync);
	addEvent('tedit', topEdit);
  addEvent('topt', topSetup);
	addEvent('tquit', topQuit);

	addEvent('lreload', panelReload, 'lcontent');
	addEvent('lhome', panelHome, 'lcontent');
	addEvent('lup', panelUp, 'lcontent');
  addEvent('lcreate', panelCreate, 'lcontent');
  addEvent('lcomp', panelComp, 'lcontent');
  addEvent('lcopy', panelCopy, 'lcontent');
	addEvent('ldel', panelDelete, 'lcontent');
  addEvent('lbox', panelBox, 'lcontent');

	addInputEvent('lcontentpath', panelGo, 'lcontent');

	addEvent('rreload', panelReload, 'rcontent');
	addEvent('rhome', panelHome, 'rcontent');
	addEvent('rup', panelUp, 'rcontent');
  addEvent('rcreate', panelCreate, 'rcontent');
  addEvent('rcomp', panelComp, 'rcontent');
  addEvent('rcopy', panelCopy, 'rcontent');
	addEvent('rdel', panelDelete, 'rcontent');
  addEvent('rbox', panelBox, 'rcontent');

	addInputEvent('rcontentpath', panelGo, 'rcontent');

  syncDialog.init();

	// drag and drop events

  const darear = document.getElementById('rcontent');

  darear.addEventListener('dragenter', function(evnt) {
   if (evnt.preventDefault) evnt.preventDefault();
   return false;
  });

  darear.addEventListener('dragover', function(evnt) {
   if (evnt.preventDefault) evnt.preventDefault();
   evnt.dataTransfer.dropEffect = 'copy';
   return false;
  });

  darear.addEventListener(
    'drop', 
    function(evnt) {
      if (evnt.stopPropagation) evnt.stopPropagation();
      panelCopy('lcontent');
      evnt.preventDefault(); 
      return false;
    }, 
    false
  );

}