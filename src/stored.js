import {Property} from './property';

class StoredProperty extends Property {
    field;

    constructor(initialValue, filter) {
        super();
        if (filter !== undefined) {
            this.filter = filter;
        }
        this.field = (this.filter)(initialValue);
    }

    filter(value) {
        return value;
    }

    get() {
        return this.field;
    }

    set(value) {
        value = (this.filter)(value);
        if (this.field !== value) {
            this.field = value;
            this.markDirty();
        }
    }
}

export function stored(initialValue) {
    return new StoredProperty(initialValue);
}
