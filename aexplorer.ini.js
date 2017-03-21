var config={
    "Archiver": {
        "name": "archiver",
        "input": "zip.exe -r"
    },
    "Unarchive": {
        "list": [
            {
                "name": "overwrite",
                "label": "Overwrite",
                "checkbox": false
            },
            {
                "name": "path",
                "label": "Keep paths",
                "checkbox": true
            }
        ]
    },
    "Memory": {
        "list": [
            {
                "name": "leftpane",
                "label": "Left panel:",
                "size": "60",
                "input": "w:\\cryonie.com"
            },
            {
                "name": "rightpane",
                "label": "Right panel:",
                "size": "60",
                "input": "p:\\temp\\zip"
            }
        ]
    },
    "Bookmarks": {
        "list": [
            {
                "name": "lcontent",
                "label": "Left panel",
                "initial": "w:/",
                "select": [
                    "w:/",
                    "p:/",
                    "d:/",
                    "e:/"
                ]
            },
            {
                "name": "rcontent",
                "label": "Right panel",
                "initial": "c:\\",
                "select": [
                    "c:\\",
                    "w:\\",
                    "d:/",
                    "c:/MinGW",
                    "c:/MinGW/mingw32/bin",
                    "p:/",
                    "e:/",
                    "f:/"
                ]
            }
        ]
    },
    "Editor": {
        "list": [
            {
                "name": "Theme",
                "label": "Theme",
                "input": "Chaos"
            },
            {
                "name": "FontSize",
                "label": "Font size (px)",
                "input": "14px"
            }
        ]
    },
    "Recents": {
        "list": [
            [
                "w:\\cryonie.com\\killbillou-wordpress.php",
                0
            ],
            [
                "p:\\temp\\atom-beautify-master\\script\\build-options.js",
                325
            ],
            [
                "p:\\temp\\atom-beautify-master\\examples\\editorconfig-options\\html\\expected\\test.html",
                0
            ],
            [
                "p:\\temp\\atom-beautify-master\\examples\\editorconfig-options\\html\\original\\test.html",
                0
            ],
            [
                "p:\\temp\\atom-beautify-master\\src\\beautifiers\\crystal.coffee",
                0
            ],
            [
                "p:\\Scripts\\propagator\\propag.sol",
                379
            ],
            [
                "p:\\Scripts\\backcount\\backcount.js",
                0
            ],
            [
                "p:\\Scripts\\comb\\comb.sol",
                0
            ],
            [
                "p:\\Scripts\\Ajaxol\\Sajax.sol",
                0
            ],
            [
                "p:\\Scripts\\Ajaxol\\multiply.sol",
                19
            ],
            [
                "w:\\Tiloid\\tiloid.js",
                0
            ],
            [
                "w:\\hiti.fr\\chronique.css",
                0
            ],
            [
                "p:\\temp\\backcount\\backcount.sol",
                29
            ],
            [
                "p:\\AExplorer\\aexplorer.css",
                29
            ],
            [
                "p:\\AExplorer\\aexplorer.ini.js",
                0
            ],
            [
                "p:\\solj\\check.js",
                42
            ],
            [
                "p:\\scriptolc\\CONTENT.TXT",
                28
            ]
        ]
    }
}