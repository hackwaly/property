const Flags_updated = 1;

let dirtySeeds = new Set();
let updateQueue = new Set();

let scheduled = false;
let fulfilled = Promise.resolve();

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
    scheduled = false;
}
