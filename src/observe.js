export function observe(property, callback) {
    let revision = NaN;
    let observer = {
        onNotify(property) {
            let value = property.value();
            if (property.revision !== revision) {
                revision = property.revision;
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
