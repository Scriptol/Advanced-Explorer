var config={
    "Archiver": {
        "name": "archiver",
        "input": "pkzip.exe -add -path"
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
                "input": "p:\\AExplorer\\AExplorer"
            },
            {
                "name": "rightpane",
                "label": "Right panel:",
                "size": "60",
                "input": "p:\\Advanced-Explorer\\AExplorer"
            }
        ]
    },
    "Bookmarks": {
        "list": [
            {
                "name": "lcontent",
                "label": "Left panel",
                "initial": "c:\\",
                "select": [
                    "c:\\",
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
                    "e:/"
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
            },
            {
                "name": "lastprj",
                "label": "Current project",
                "input": "p:\\AExplorer\\demo.prj"
            }
        ]
    }
}