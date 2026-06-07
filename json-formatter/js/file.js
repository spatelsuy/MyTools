document.getElementById("fileInput").addEventListener("change", e => {

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        document.getElementById("input").value = event.target.result;
    };

    reader.readAsText(file);
});

function downloadJSON() {

    const data = document.getElementById("output").innerText;

    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    a.click();
}
