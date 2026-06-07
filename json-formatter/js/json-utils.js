function getJSON() {
    return document.getElementById("inputArea").value;
}

function setOutput(data) {
    document.getElementById("outputArea").textContent = data;
    updateStats(data);
    renderTree(data);
}

function formatJSON() {
    try {
        const obj = JSON.parse(getJSON());
        setOutput(JSON.stringify(obj, null, 4));
        setStatus("Valid JSON ✔");
    } catch (e) {
        setStatus("Invalid JSON ✖");
    }
}

function minifyJSON() {
    try {
        const obj = JSON.parse(getJSON());
        setOutput(JSON.stringify(obj));
        setStatus("Minified ✔");
    } catch (e) {
        setStatus("Invalid JSON ✖");
    }
}

function validateJSON() {
    try {
        JSON.parse(getJSON());
        setStatus("Valid JSON ✔");
    } catch (e) {
        setStatus("Invalid JSON ✖ " + e.message);
    }
}

function autoFixJSON() {
    let text = getJSON();

    let fixes = [];

    // STEP 1: Remove trailing commas
    let before = text;
    text = text.replace(/,\s*}/g, "}");
    text = text.replace(/,\s*]/g, "]");
    if (before !== text) fixes.push("Removed trailing commas");

    // STEP 2: Convert single quotes to double quotes (safe mode)
    before = text;
    text = text.replace(/'/g, '"');
    if (before !== text) fixes.push("Replaced single quotes");

    // STEP 3: Fix unquoted keys (basic version)
    // example: { name: "John" } → { "name": "John" }
    before = text;
    text = text.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
    if (before !== text) fixes.push("Quoted object keys");

    // STEP 4: Try parsing
    try {
        const obj = JSON.parse(text);

        document.getElementById("inputArea").value =
            JSON.stringify(obj, null, 4);

        setStatus("Auto Fix Successful ✔ (" + fixes.join(", ") + ")");
    } catch (e) {
        setStatus("Auto Fix Failed ✖ - JSON too corrupted");
    }
}

function searchJSON() {
    const keyword = document.getElementById("searchBox").value;
    const text = getJSON();

    if (!keyword) return;

    const highlighted = text.replaceAll(keyword, `>>${keyword}<<`);
    setOutput(highlighted);
}

function updateStats(jsonStr) {
    try {
        const obj = JSON.parse(jsonStr);

        const stats = {
            objects: 0,
            arrays: 0,
            keys: 0
        };

        function walk(o) {
            if (typeof o === "object" && !Array.isArray(o)) {
                stats.objects++;
                Object.keys(o).forEach(k => {
                    stats.keys++;
                    walk(o[k]);
                });
            } else if (Array.isArray(o)) {
                stats.arrays++;
                o.forEach(walk);
            }
        }

        walk(obj);

        document.getElementById("stats").innerText =
            `Objects: ${stats.objects} | Arrays: ${stats.arrays} | Keys: ${stats.keys}`;

    } catch (e) {}
}

function setStatus(msg) {
    document.getElementById("status").innerText = msg;
}

function newJSON() {
    document.getElementById("inputArea").value = "{}";
    setOutput("{}");
}
