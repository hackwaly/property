let dirtySeeds = new Set();
let updateQueue = new Set();

let scheduled = false;
let fulfilled = Promise.resolve();
let committing = false;

function schedule() {
    if (!scheduled) {
        scheduled = true;
        fulfilled.then(commit);
    }
}

export function mark(property) {
    dirtySeeds.add(property);
    schedule();
}

export function queue(property) {
    updateQueue.add(property);
    schedule();
}

export function commit() {
    if (committing) {
        return;
    }
    committing = true;
    while (dirtySeeds.size > 0 || updateQueue.size > 0) {
        while (dirtySeeds.size > 0) {
            let properties = dirtySeeds;
            dirtySeeds = new Set();
            properties.forEach((property) => {
                property.notifyObservers();
            });
        }
        while (updateQueue.size > 0) {
            let properties = updateQueue;
            updateQueue = new Set();
            properties.forEach((property) => {
                property.update();
            });
        }
    }
    committing = false;
    scheduled = false;
}
