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
    let text = getJSON().trim();
    let fixes = [];

    // STEP 1: Basic cleanup
    text = text.replace(/'/g, '"');
    text = text.replace(/,\s*}/g, '}');
    text = text.replace(/,\s*]/g, ']');

    // STEP 2: Try direct parse first
    try {
        const obj = JSON.parse(text);
        alert("1 = " + text);
        document.getElementById("inputArea").value =
            JSON.stringify(obj, null, 4);

        setStatus("Auto Fix Successful ✔ (No repair needed)");
        return;
    } catch (e) {
        fixes.push("Initial parse failed - starting repair");
    }

    // STEP 3: STRUCTURE REPAIR (STACK BALANCING)
    let stack = [];

    let inString = false;
    let escaped = false;

    for (let char of text) {

        if (escaped) {
            escaped = false;
            continue;
        }

        if (char === "\\") {
            escaped = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (inString) continue;

        if (char === '{') stack.push('}');
        else if (char === '[') stack.push(']');
        else if (char === '}' || char === ']') {
            stack.pop();
        }
    }

    // STEP 4: AUTO CLOSE MISSING BRACKETS
    while (stack.length > 0) {
        text += stack.pop();
        fixes.push("Added missing closing bracket");
    }

    // STEP 5: FINAL PARSE
    try {
        const obj = JSON.parse(text);
        alert("2 = " + text);
        document.getElementById("inputArea").value =
            JSON.stringify(obj, null, 4);

        setStatus("Auto Fix Successful ✔ (" + fixes.join(", ") + ")");
    } catch (e) {
        setStatus("Auto Fix Failed ✖ - Cannot repair structure safely");
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
