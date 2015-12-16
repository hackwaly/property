export function observe(property, callback) {
    let version = NaN;
    let observer = {
        onNotify(property) {
            let value = property.value();
            if (property.version !== version) {
                version = property.version;
                callback(value);
            }
        },
        dispose() {
            property.removeObserver(observer);
        }
    };
    property.addObserver(observer);
    observer.onNotify(property);
    return observer;
}
