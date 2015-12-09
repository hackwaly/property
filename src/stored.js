import {Property} from './property';

class StoredProperty extends Property {
    field;

    constructor(initialValue) {
        super();
        this.field = initialValue;
    }

    get() {
        return this.field;
    }

    set(value) {
        if (this.field !== value) {
            this.field = value;
            this.markDirty();
        }
    }
}

export function stored(initialValue) {
    return new StoredProperty(initialValue);
}
