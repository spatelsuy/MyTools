function analyze(obj) {

    let stats = {
        objects: 0,
        arrays: 0,
        keys: 0
    };

    function walk(o) {

        if (typeof o === "object" && !Array.isArray(o)) {
            stats.objects++;
            for (let k in o) {
                stats.keys++;
                walk(o[k]);
            }
        }

        else if (Array.isArray(o)) {
            stats.arrays++;
            o.forEach(walk);
        }
    }

    walk(obj);

    return stats;
}
