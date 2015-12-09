import * as dependencyDetection from './dependency_detection';
import * as dirtyPropagation from './dirty_propagation';

export class Property {
    revision = 0;
    observers = [];

    isFinal() {
        return false;
    }

    isWritable() {
        return true;
    }

    isComputed() {
        return false;
    }

    isInjectable() {
        return false;
    }

    value() {
        if (!this.isFinal()) {
            dependencyDetection.track(this);
        }
        return this.get();
    }

    get() {
    }

    addObserver(observer) {
        if (this.isFinal()) {
            return;
        }
        this.observers.push(observer);
    }

    removeObserver(observer) {
        if (this.isFinal()) {
            return;
        }
        let index = this.observers.indexOf(observer);
        if (index >= 0) {
            this.observers.splice(index, 1);
        }
    }

    notifyObservers() {
        this.observers.forEach((observer) => {
            observer.onNotify(this);
        });
        if (this.isFinal()) {
            this.observers = null;
        }
    }

    markDirty() {
        this.revision++;
        dirtyPropagation.mark(this);
    }
}

export function isProperty(obj) {
    return obj instanceof Property;
}
