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
    "Display": {
        "list": [
            {
                "name": "dotfile",
                "label": "Show files starting with a dot",
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
                "input": "\"
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
                "initial": "w:/",
                "select": [
                    "c:\\",
                    "d:/"
                ]
            },
            {
                "name": "rcontent",
                "label": "Right panel",
                "initial": "c:\\",
                "select": [
                    "c:\\",
                    "d:/"
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
        ]
    },
    "Recdirs": {
        "list": [
            [
                "c:/"
            ],
            [
                "c:/"
            ]
        ]
    }
}