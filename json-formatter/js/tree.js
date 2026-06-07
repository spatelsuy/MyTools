function renderTree(obj, parent = document.getElementById("tree")) {
    parent.innerHTML = "";

    function build(node, indent = 0) {

        if (typeof node === "object" && !Array.isArray(node)) {

            for (let key in node) {
                let div = document.createElement("div");
                div.style.marginLeft = indent + "px";
                div.innerText = "▶ " + key;
                parent.appendChild(div);

                build(node[key], indent + 15);
            }

        } else {
            let div = document.createElement("div");
            div.style.marginLeft = indent + "px";
            div.innerText = node;
            parent.appendChild(div);
        }
    }

    build(obj);
}
