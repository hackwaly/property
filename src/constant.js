import {Property} from './property';

class ConstantProperty extends Property {
    field;

    constructor(value) {
        super();
        this.field = value;
    }

    isFinal() {
        return true;
    }

    isWritable() {
        return false;
    }

    get() {
        return this.field;
    }
}

export function constant(value) {
    return new ConstantProperty(value);
}
