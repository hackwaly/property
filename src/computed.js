import {Property} from './property.js';
import * as dependencyDetection from './dependency_detection';
import * as dirtyPropagation from './dirty_propagation';

const Flags_none = 0;
const Flags_updated = 1;
const Flags_evaluating = 2;
const Flags_final = 4;

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
        if (this.field !== value) {
            this.field = value;
            this.markDirty();
        }
        this.flags |= Flags_updated;
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

    onNotify() {
        this.flags &= ~Flags_updated;
        dirtyPropagation.queue(this);
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
