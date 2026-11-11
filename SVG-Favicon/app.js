(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const state = {
    mode: "design",
    uploadedImage: null,
    uploadedDataUrl: null,
    uploadedFileName: "",
    objectUrl: null
  };

  const SHAPE_PATHS = {
    rounded: "M112 16 H400 A96 96 0 0 1 496 112 V400 A96 96 0 0 1 400 496 H112 A96 96 0 0 1 16 400 V112 A96 96 0 0 1 112 16 Z",
    circle: "M256 16 A240 240 0 1 1 256 496 A240 240 0 1 1 256 16 Z",
    square: "M16 16 H496 V496 H16 Z",
    diamond: "M256 16 L496 256 L256 496 L16 256 Z"
  };

  const FONT_FAMILIES = {
    "Arial, Helvetica, sans-serif": "Arial, Helvetica, sans-serif",
    "Georgia, serif": "Georgia, serif",
    "Verdana, sans-serif": "Verdana, sans-serif",
    "Trebuchet MS, sans-serif": "'Trebuchet MS', sans-serif",
    "Courier New, monospace": "'Courier New', monospace"
  };

  function currentShape() {
    return state.mode === "design" ? $("shapeSelect").value : $("uploadShape").value;
  }

  function currentBackground() {
    return state.mode === "design" ? $("backgroundColor").value : $("uploadBackground").value;
  }

  function traceCanvasShape(ctx, shape) {
    ctx.beginPath();
    if (shape === "circle") {
      ctx.arc(256, 256, 240, 0, Math.PI * 2);
    } else if (shape === "square") {
      ctx.rect(16, 16, 480, 480);
    } else if (shape === "diamond") {
      ctx.moveTo(256, 16);
      ctx.lineTo(496, 256);
      ctx.lineTo(256, 496);
      ctx.lineTo(16, 256);
      ctx.closePath();
    } else {
      const x = 16, y = 16, w = 480, h = 480, r = 96;
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }
  }

  function fitTextSize(ctx, text) {
    let size = 300;
    const maxWidth = 410;
    while (size > 48) {
      ctx.font = `${$("boldText").checked ? 800 : 500} ${size}px ${$("fontSelect").value}`;
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 4;
    }
    return size;
  }

  function imagePlacement(image, fit) {
    const iw = image.naturalWidth || image.width;
    const ih = image.naturalHeight || image.height;
    const scale = fit === "cover" ? Math.max(512 / iw, 512 / ih) : Math.min(512 / iw, 512 / ih);
    const width = iw * scale;
    const height = ih * scale;
    return {
      x: (512 - width) / 2,
      y: (512 - height) / 2,
      width,
      height
    };
  }

  function drawIcon(ctx, size) {
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    const scale = size / 512;
    ctx.scale(scale, scale);

    const shape = currentShape();

    if (state.mode === "design") {
      traceCanvasShape(ctx, shape);
      ctx.fillStyle = $("backgroundColor").value;
      ctx.fill();

      const text = $("iconText").value.trim() || "S";
      const fontSize = fitTextSize(ctx, text);
      ctx.font = `${$("boldText").checked ? 800 : 500} ${fontSize}px ${$("fontSelect").value}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = $("textColor").value;
      ctx.fillText(text, 256, 263, 430);
    } else if (state.uploadedImage) {
      if ($("useBackground").checked) {
        traceCanvasShape(ctx, shape);
        ctx.fillStyle = $("uploadBackground").value;
        ctx.fill();
      }

      ctx.save();
      traceCanvasShape(ctx, shape);
      ctx.clip();
      const placement = imagePlacement(state.uploadedImage, $("imageFit").value);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        state.uploadedImage,
        placement.x,
        placement.y,
        placement.width,
        placement.height
      );
      ctx.restore();
    }

    ctx.restore();
  }

  function renderPreviews() {
    const main = $("previewCanvas");
    drawIcon(main.getContext("2d"), 512);

    const canExport = state.mode === "design" || Boolean(state.uploadedImage);
    $("downloadPackageButton").disabled = !canExport;
    $("downloadSvgButton").disabled = !canExport;
    $("downloadIcoButton").disabled = !canExport;
  }

  function setStatus(message, isError = false) {
    const el = $("statusMessage");
    el.textContent = message;
    el.classList.toggle("error", isError);
  }

  function setMode(mode) {
    state.mode = mode;
    const design = mode === "design";
    $("designPanel").classList.toggle("hidden", !design);
    $("uploadPanel").classList.toggle("hidden", design);
    $("designModeButton").classList.toggle("active", design);
    $("uploadModeButton").classList.toggle("active", !design);
    $("designModeButton").setAttribute("aria-pressed", String(design));
    $("uploadModeButton").setAttribute("aria-pressed", String(!design));
    setStatus(design ? "Design preview updated." : (state.uploadedImage ? "Image preview updated." : "Choose an image to continue."));
    renderPreviews();
  }

  function xmlEscape(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"
    })[char]);
  }

  function buildSvg() {
    const shape = currentShape();
    const path = SHAPE_PATHS[shape] || SHAPE_PATHS.rounded;
    let content = "";

    if (state.mode === "design") {
      const text = $("iconText").value.trim() || "S";
      const measureCanvas = document.createElement("canvas");
      const ctx = measureCanvas.getContext("2d");
      const fontSize = fitTextSize(ctx, text);
      const fontFamily = FONT_FAMILIES[$("fontSelect").value] || "Arial, sans-serif";
      content = `
  <path d="${path}" fill="${$("backgroundColor").value}"/>
  <text x="256" y="263" text-anchor="middle" dominant-baseline="middle"
        fill="${$("textColor").value}" font-family="${xmlEscape(fontFamily)}"
        font-size="${fontSize}" font-weight="${$("boldText").checked ? 800 : 500}">${xmlEscape(text)}</text>`;
    } else {
      if (!state.uploadedImage || !state.uploadedDataUrl) {
        throw new Error("Choose an image before exporting.");
      }
      const placement = imagePlacement(state.uploadedImage, $("imageFit").value);
      const background = $("useBackground").checked
        ? `<path d="${path}" fill="${$("uploadBackground").value}"/>`
        : "";
      content = `
  <defs><clipPath id="iconClip"><path d="${path}"/></clipPath></defs>
  ${background}
  <image xlink:href="${state.uploadedDataUrl}" href="${state.uploadedDataUrl}" x="${placement.x.toFixed(3)}" y="${placement.y.toFixed(3)}"
         width="${placement.width.toFixed(3)}" height="${placement.height.toFixed(3)}"
         preserveAspectRatio="none" clip-path="url(#iconClip)"/>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="SPBasic icon">
${content}
</svg>`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function downloadText(text, filename, type) {
    downloadBlob(new Blob([text], { type }), filename);
  }

  function canvasPngBlob(size) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    drawIcon(canvas.getContext("2d"), size);
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("The browser could not create a PNG image."));
      }, "image/png");
    });
  }

  async function buildIco() {
    const sizes = [16, 32, 48, 256];
    const pngBlobs = await Promise.all(sizes.map((size) => canvasPngBlob(size)));
    const pngBytes = await Promise.all(pngBlobs.map(async (blob) => new Uint8Array(await blob.arrayBuffer())));

    const header = new Uint8Array(6 + sizes.length * 16);
    const view = new DataView(header.buffer);
    view.setUint16(0, 0, true);
    view.setUint16(2, 1, true);
    view.setUint16(4, sizes.length, true);

    let offset = header.length;
    sizes.forEach((size, index) => {
      const entry = 6 + index * 16;
      header[entry] = size === 256 ? 0 : size;
      header[entry + 1] = size === 256 ? 0 : size;
      header[entry + 2] = 0;
      header[entry + 3] = 0;
      view.setUint16(entry + 4, 1, true);
      view.setUint16(entry + 6, 32, true);
      view.setUint32(entry + 8, pngBytes[index].length, true);
      view.setUint32(entry + 12, offset, true);
      offset += pngBytes[index].length;
    });

    return new Blob([header, ...pngBytes], { type: "image/x-icon" });
  }

  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
      crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function dosDateTime() {
    const now = new Date();
    const year = Math.max(1980, now.getFullYear());
    const time = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
    const date = ((year - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    return { time, date };
  }

  async function createZip(files) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    const stamp = dosDateTime();
    let localOffset = 0;

    for (const file of files) {
      const nameBytes = encoder.encode(file.name);
      const data = file.data instanceof Uint8Array
        ? file.data
        : new Uint8Array(await file.data.arrayBuffer());
      const checksum = crc32(data);

      const localHeader = new Uint8Array(30 + nameBytes.length);
      const localView = new DataView(localHeader.buffer);
      localView.setUint32(0, 0x04034B50, true);
      localView.setUint16(4, 20, true);
      localView.setUint16(6, 0x0800, true);
      localView.setUint16(8, 0, true);
      localView.setUint16(10, stamp.time, true);
      localView.setUint16(12, stamp.date, true);
      localView.setUint32(14, checksum, true);
      localView.setUint32(18, data.length, true);
      localView.setUint32(22, data.length, true);
      localView.setUint16(26, nameBytes.length, true);
      localView.setUint16(28, 0, true);
      localHeader.set(nameBytes, 30);
      localParts.push(localHeader, data);

      const centralHeader = new Uint8Array(46 + nameBytes.length);
      const centralView = new DataView(centralHeader.buffer);
      centralView.setUint32(0, 0x02014B50, true);
      centralView.setUint16(4, 20, true);
      centralView.setUint16(6, 20, true);
      centralView.setUint16(8, 0x0800, true);
      centralView.setUint16(10, 0, true);
      centralView.setUint16(12, stamp.time, true);
      centralView.setUint16(14, stamp.date, true);
      centralView.setUint32(16, checksum, true);
      centralView.setUint32(20, data.length, true);
      centralView.setUint32(24, data.length, true);
      centralView.setUint16(28, nameBytes.length, true);
      centralView.setUint16(30, 0, true);
      centralView.setUint16(32, 0, true);
      centralView.setUint16(34, 0, true);
      centralView.setUint16(36, 0, true);
      centralView.setUint32(38, 0, true);
      centralView.setUint32(42, localOffset, true);
      centralHeader.set(nameBytes, 46);
      centralParts.push(centralHeader);

      localOffset += localHeader.length + data.length;
    }

    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    endView.setUint32(0, 0x06054B50, true);
    endView.setUint16(4, 0, true);
    endView.setUint16(6, 0, true);
    endView.setUint16(8, files.length, true);
    endView.setUint16(10, files.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, localOffset, true);
    endView.setUint16(20, 0, true);

    return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
  }

  async function makePackage() {
    setStatus("Preparing SVG, ICO and PNG files...");
    const pngSpecs = [
      ["favicon-16x16.png", 16],
      ["favicon-32x32.png", 32],
      ["favicon-48x48.png", 48],
      ["apple-touch-icon.png", 180],
      ["android-chrome-192x192.png", 192],
      ["android-chrome-512x512.png", 512]
    ];

    const files = [];
    const svg = buildSvg();
    files.push({ name: "favicon.svg", data: new TextEncoder().encode(svg) });

    for (const [name, size] of pngSpecs) {
      files.push({ name, data: await canvasPngBlob(size) });
    }

    files.push({ name: "favicon.ico", data: await buildIco() });

    const manifest = {
      name: "Website",
      short_name: "Website",
      icons: [
        { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
      ],
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone"
    };
    files.push({
      name: "site.webmanifest",
      data: new TextEncoder().encode(JSON.stringify(manifest, null, 2))
    });

    const snippet = `<!-- SPBasic favicon links: place the generated files in your website root. -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
`;
    files.push({ name: "favicon-html-snippet.txt", data: new TextEncoder().encode(snippet) });

    const readme = `SPBasic Favicon Package

Files included:
- favicon.svg
- favicon.ico (16, 32, 48 and 256 pixel images)
- favicon-16x16.png
- favicon-32x32.png
- favicon-48x48.png
- apple-touch-icon.png (180x180)
- android-chrome-192x192.png
- android-chrome-512x512.png
- site.webmanifest
- favicon-html-snippet.txt

How to use:
1. Extract the files into your website's public/root folder.
2. Copy the HTML from favicon-html-snippet.txt into the <head> of your page.
3. If you use a subfolder or framework asset directory, update the paths in the HTML and manifest.

Privacy:
All generation happens locally in your browser. This tool does not upload your image or save your design to a server.

SVG note:
Text-and-shape designs export as vector SVG. Uploaded raster images are embedded in an SVG; they are not automatically traced into vector paths.
`;
    files.push({ name: "README.txt", data: new TextEncoder().encode(readme) });

    const zip = await createZip(files);
    downloadBlob(zip, "spbasic-favicon-package.zip");
    setStatus("Favicon package downloaded. Extract the ZIP to use the files.");
  }

  function updateColorLabels() {
    $("backgroundValue").textContent = $("backgroundColor").value.toUpperCase();
    $("textValue").textContent = $("textColor").value.toUpperCase();
    $("uploadBackgroundValue").textContent = $("uploadBackground").value.toUpperCase();
  }

  function handleImageFile(file) {
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setStatus("Please choose a PNG, JPG or WebP image.", true);
      $("imageFile").value = "";
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setStatus("Please choose an image smaller than 15 MB.", true);
      $("imageFile").value = "";
      return;
    }

    if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
    state.objectUrl = URL.createObjectURL(file);
    state.uploadedFileName = file.name;
    $("fileName").textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
    setStatus("Loading image...");

    const reader = new FileReader();
    reader.onload = () => {
      state.uploadedDataUrl = String(reader.result);
      const image = new Image();
      image.onload = () => {
        state.uploadedImage = image;
        renderPreviews();
        setStatus("Image loaded. Your original file remains on this device.");
      };
      image.onerror = () => {
        state.uploadedImage = null;
        state.uploadedDataUrl = null;
        renderPreviews();
        setStatus("The image could not be opened. Try another file.", true);
      };
      image.src = state.objectUrl;
    };
    reader.onerror = () => setStatus("The image could not be read.", true);
    reader.readAsDataURL(file);
  }

  function resetTool() {
    if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
    state.mode = "design";
    state.uploadedImage = null;
    state.uploadedDataUrl = null;
    state.uploadedFileName = "";
    state.objectUrl = null;

    $("iconText").value = "S";
    $("shapeSelect").value = "rounded";
    $("fontSelect").value = "Arial, Helvetica, sans-serif";
    $("backgroundColor").value = "#2457D6";
    $("textColor").value = "#FFFFFF";
    $("boldText").checked = true;
    $("uploadShape").value = "rounded";
    $("imageFit").value = "contain";
    $("uploadBackground").value = "#FFFFFF";
    $("useBackground").checked = true;
    $("imageFile").value = "";
    $("fileName").textContent = "No image selected.";

    updateColorLabels();
    setMode("design");
    setStatus("Reset complete. Create a new icon.");
  }

  function wireEvents() {
    $("designModeButton").addEventListener("click", () => setMode("design"));
    $("uploadModeButton").addEventListener("click", () => setMode("upload"));
    $("resetButton").addEventListener("click", resetTool);
    $("imageFile").addEventListener("change", (event) => handleImageFile(event.target.files[0]));

    [
      "iconText", "shapeSelect", "fontSelect", "backgroundColor", "textColor",
      "boldText", "uploadShape", "imageFit", "uploadBackground", "useBackground"
    ].forEach((id) => {
      $(id).addEventListener("input", () => {
        updateColorLabels();
        renderPreviews();
      });
      $(id).addEventListener("change", () => {
        updateColorLabels();
        renderPreviews();
      });
    });

    $("downloadSvgButton").addEventListener("click", () => {
      try {
        downloadText(buildSvg(), "favicon.svg", "image/svg+xml;charset=utf-8");
        setStatus("SVG downloaded.");
      } catch (error) {
        setStatus(error.message, true);
      }
    });

    $("downloadIcoButton").addEventListener("click", async () => {
      try {
        setStatus("Creating ICO file...");
        const ico = await buildIco();
        downloadBlob(ico, "favicon.ico");
        setStatus("ICO downloaded with 16, 32, 48 and 256 pixel sizes.");
      } catch (error) {
        setStatus(error.message || "Could not create the ICO file.", true);
      }
    });

    $("downloadPackageButton").addEventListener("click", async () => {
      try {
        await makePackage();
      } catch (error) {
        console.error(error);
        setStatus(error.message || "Could not create the favicon package.", true);
      }
    });

    window.addEventListener("beforeunload", () => {
      if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
    });
  }

  updateColorLabels();
  wireEvents();
  renderPreviews();
})();