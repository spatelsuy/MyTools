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

    text = text.replace(/'/g, '"');
    text = text.replace(/,\s*}/g, '}');
    text = text.replace(/,\s*]/g, ']');

    document.getElementById("inputArea").value = text;

    setStatus("Auto Fix Applied ⚡");
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
