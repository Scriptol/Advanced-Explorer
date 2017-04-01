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
                "input": "/"
            },
            {
                "name": "rightpane",
                "label": "Right panel:",
                "size": "60",
                "input": "/"
            }
        ]
    },
    "Bookmarks": {
        "list": [
            {
                "name": "lcontent",
                "label": "Left panel",
                "initial": "c:/",
                "select": [
                    "c:/",
                    "d:/",
                    "e:/"
                ]
            },
            {
                "name": "rcontent",
                "label": "Right panel",
                "initial": "c:/",
                "select": [
                    "c:/",
                    "d:/",
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
        ]
    }
}
