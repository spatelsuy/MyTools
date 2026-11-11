SPBasic Favicon Generator
=========================

Files
-----
- index.html
- style.css
- app.js

How to run
----------
1. Keep all three files in the same folder.
2. Open index.html in a modern browser.
3. Choose "From text" to create a text-and-shape icon, or "From image" to create an icon from a PNG, JPG or WebP image.
4. Download SVG, ICO, or the complete favicon package ZIP.

No build tools, frameworks, libraries, API keys, or server are required.
The app does not make network requests. All image processing and file generation happen in the browser.

Outputs in the package
----------------------
- favicon.svg
- favicon.ico (16, 32, 48 and 256 pixel PNG-backed ICO entries)
- favicon-16x16.png
- favicon-32x32.png
- favicon-48x48.png
- apple-touch-icon.png (180x180)
- android-chrome-192x192.png
- android-chrome-512x512.png
- site.webmanifest
- favicon-html-snippet.txt

SVG behavior
------------
A text-and-shape design is exported as true vector SVG.
An uploaded PNG/JPG/WebP is embedded as a data URI inside an SVG. It is not automatically traced into editable vector paths.

Privacy
-------
The tool does not upload images, store designs in localStorage/IndexedDB, or send data to a server. The selected image remains in browser memory for the current page session.
