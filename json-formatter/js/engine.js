function run(inputText, mode = "format") {

    if (mode === "format") {
        const obj = JSON.parse(inputText);
        return JSON.stringify(obj, null, 4);
    }

    if (mode === "minify") {
        const obj = JSON.parse(inputText);
        return JSON.stringify(obj);
    }

    return inputText;
}
