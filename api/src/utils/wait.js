module.exports = function(delay = 500) {
    return new Promise((resolve) =>
        setTimeout(() => {
            resolve();
        }, delay)
    );
}