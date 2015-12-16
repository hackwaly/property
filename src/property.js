import * as dependencyDetection from './dependency_detection';
import * as dirtyPropagation from './dirty_propagation';

class Callable {
    constructor() {
        function delegate(args) {
            return delegate.invoke(...args);
        }
        Object.setPrototypeOf(delegate, Object.getPrototypeOf(this));
        return delegate;
    }
}

export class Property extends Callable {
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

    isObserved() {
        return this.observers.length > 0;
    }

    invoke() {
        return this.value();
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
        if (this.observers.length <= 1) {
            this.enterObserved();
        }
    }

    removeObserver(observer) {
        if (this.isFinal()) {
            return;
        }
        let index = this.observers.indexOf(observer);
        if (index >= 0) {
            this.observers.splice(index, 1);
            if (this.observers.length <= 0) {
                this.leaveObserved();
            }
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

    enterObserved() {}
    
    leaveObserved() {}

    markDirty() {
        this.revision++;
        dirtyPropagation.mark(this);
    }
}

export function isProperty(obj) {
    return obj instanceof Property;
}
