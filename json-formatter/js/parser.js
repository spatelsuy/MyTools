function parseJSON(text) {
    try {
        return {
            ok: true,
            data: JSON.parse(text),
            error: null
        };
    } catch (e) {
        return {
            ok: false,
            data: null,
            error: e.message
        };
    }
}
