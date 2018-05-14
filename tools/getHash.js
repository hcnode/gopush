function get_hash(key) {
    let hash = 0;
    if (!key || key.length == 0) return 0;
    for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
    }
    return Math.abs(hash);
}
module.exports = function (key) {
    return get_hash(key);
}