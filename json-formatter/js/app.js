function getInput() {
    return document.getElementById("input").value;
}

function setOutput(data) {
    document.getElementById("output").innerText = data;
}

function formatJSON() {
    const parsed = parseJSON(getInput());

    if (parsed.ok) {
        const out = JSON.stringify(parsed.data, null, 4);
        setOutput(out);
        updateUI(parsed.data);
    } else {
        setStatus("Invalid JSON ❌ " + parsed.error);
    }
}

function minifyJSON() {
    const parsed = parseJSON(getInput());

    if (parsed.ok) {
        setOutput(JSON.stringify(parsed.data));
    }
}

function validateJSON() {
    const parsed = parseJSON(getInput());
    setStatus(parsed.ok ? "Valid JSON ✔" : parsed.error);
}

function autoFix(mode) {

    const result = autoFix(getInput(), mode);

    document.getElementById("input").value = result.text;

    setStatus("Auto Fix (" + mode + ") → " + result.fixes.join(", "));
}

function newJSON() {
    document.getElementById("input").value = "{}";
    setOutput("{}");
}

function searchJSON() {
    let text = getInput();
    let key = document.getElementById("search").value;

    if (!key) return;

    setOutput(text.replaceAll(key, ">>" + key + "<<"));
}

function setStatus(msg) {
    document.getElementById("status").innerText = msg;
}

function updateUI(obj) {

    renderTree(obj);

    let stats = analyze(obj);

    document.getElementById("stats").innerText =
        `Objects: ${stats.objects} | Arrays: ${stats.arrays} | Keys: ${stats.keys}`;
}
