import {Property} from './property.js';
import * as dependencyDetection from './dependency_detection';
import * as dirtyPropagation from './dirty_propagation';

const Flags_none = 0;
const Flags_updated = 1;
const Flags_evaluating = 2;
const Flags_final = 4;

let isDoingEnterObserved = false;

class ComputedProperty extends Property {
    flags = Flags_none;
    field = undefined;
    dependencies = null;
    getter;
    setter;

    constructor(getter, setter) {
        super();
        this.getter = getter;
        if (setter !== undefined) {
            this.setter = setter;
        }
    }

    isFinal() {
        return (this.flags & Flags_final) !== 0;
    }

    isWritable() {
        return this.setter !== undefined;
    }

    isComputed() {
        return true;
    }

    isPure() {
        return false;
    }

    get() {
        dirtyPropagation.commit();
        if (!this.isObserved() && !isDoingEnterObserved) {
            return (this.getter)();
        }
        this.update();
        return this.field;
    }

    update() {
        if ((this.flags & Flags_updated) !== 0) {
            return;
        }
        if ((this.flags & Flags_evaluating) !== 0) {
            throw new Error('Computed property with circular getter is not supported');
        }
        this.flags |= Flags_evaluating;
        let {value, dependencies} = dependencyDetection.evaluate(this.getter);
        this.flags &= ~Flags_evaluating;
        if (this.isPure() && dependencies.size <= 0) {
            this.flags |= Flags_final;
            this.getter = null;
            this.swapLinkedDependencies(this.dependencies, null, true);
        } else {
            this.swapLinkedDependencies(this.dependencies, dependencies, true);
        }

        this.field = value;
        this.flags |= Flags_updated;

        if (this.field !== value) {
            this.markDirty();
        }
    }

    swapLinkedDependencies(oldDependencies, newDependencies, update) {
        if (oldDependencies !== null) {
            oldDependencies.forEach((dependency) => {
                if (newDependencies === null || !newDependencies.has(dependency)) {
                    dependency.removeObserver(this);
                }
            });
        }
        if (newDependencies !== null) {
            newDependencies.forEach((dependency) => {
                if (oldDependencies === null || !oldDependencies.has(dependency)) {
                    dependency.addObserver(this);
                }
            });
        }
        if (update) {
            this.dependencies = newDependencies;
        }
    }

    set(value) {
        if (this.setter === undefined) {
            throw new Error('Write to non-writable computed property');
        }
        (this.setter)(value);
    }

    enterObserved() {
        let prev = isDoingEnterObserved;
        isDoingEnterObserved = true;
        this.update();
        isDoingEnterObserved = prev;
    }

    leaveObserved() {
        this.swapLinkedDependencies(this.dependencies, null, true);
        this.field = undefined;
        this.flags &= ~Flags_updated;
    }

    onNotify() {
        this.flags &= ~Flags_updated;
        if (this.observers.length > 0) {
            dirtyPropagation.queue(this);
        }
    }
}

class PureComputedProperty extends ComputedProperty {
    constructor(getter) {
        super(getter);
    }

    isPure() {
        return true;
    }
}

export function computed(getter, setter) {
    return new ComputedProperty(getter, setter);
}

export function pure(getter) {
    return new PureComputedProperty(getter);
}
