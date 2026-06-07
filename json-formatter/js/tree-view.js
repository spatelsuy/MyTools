function renderTree(jsonStr) {
    const container = document.getElementById("treeView");

    try {
        const obj = JSON.parse(jsonStr);
        container.innerHTML = "";

        function build(node, indent = 0) {
            const div = document.createElement("div");

            if (typeof node === "object" && !Array.isArray(node)) {
                for (let key in node) {
                    const item = document.createElement("div");
                    item.style.marginLeft = indent + "px";
                    item.innerText = "▶ " + key;
                    container.appendChild(item);

                    build(node[key], indent + 20);
                }
            } else {
                const item = document.createElement("div");
                item.style.marginLeft = indent + "px";
                item.innerText = node;
                container.appendChild(item);
            }
        }

        build(obj);

    } catch (e) {
        container.innerHTML = "Invalid JSON";
    }
}
