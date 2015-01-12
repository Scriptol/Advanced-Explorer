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
                "input": "c:\\"
            },
            {
                "name": "rightpane",
                "label": "Right panel:",
                "size": "60",
                "input": "c:\\"
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
                    "c:\\"
                ]
            },
            {
                "name": "rcontent",
                "label": "Right panel",
                "initial": "c:\\",
                "select": [
                    "c:\\"
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
                "input": ""
            }
        ]
    }
}
