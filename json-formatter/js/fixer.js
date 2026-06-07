function autoFix(text, mode = "safe") {

    let fixes = [];

    // SAFE FIX
    text = text.replace(/,\s*}/g, "}");
    text = text.replace(/,\s*]/g, "]");
    text = text.replace(/'/g, '"');
    alert(text);
    if (mode === "safe") {
        return { text, fixes };
    }

    // SMART FIX
    if (mode === "smart" || mode === "aggressive") {

        // quote keys
        text = text.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

        fixes.push("Fixed unquoted keys");
    }

    // AGGRESSIVE FIX (structure repair)
    if (mode === "aggressive") {

        let stack = [];
        let inString = false;
        let escape = false;

        for (let c of text) {

            if (escape) { escape = false; continue; }
            if (c === "\\") { escape = true; continue; }
            if (c === '"') { inString = !inString; continue; }

            if (inString) continue;

            if (c === "{") stack.push("}");
            else if (c === "[") stack.push("]");
            else if (c === "}" || c === "]") stack.pop();
        }

        while (stack.length > 0) {
            text += stack.pop();
            fixes.push("Closed missing bracket");
        }
    }
    alert("Fixed = " + text);
    return { text, fixes };
}
