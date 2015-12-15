import {Property} from './property';

class StoredProperty extends Property {
    field;

    constructor(initialValue, filter) {
        super();
        this.field = (this.filter)(initialValue);
        if (filter !== undefined) {
            this.filter = filter;
        }
    }

    filter(value) {
        return value;
    }

    get() {
        return this.field;
    }

    set(value) {
        if (this.filter !== undefined) {
            value = (this.filter)(value);
        }
        if (this.field !== value) {
            this.field = value;
            this.markDirty();
        }
    }
}

export function stored(initialValue) {
    return new StoredProperty(initialValue);
}
