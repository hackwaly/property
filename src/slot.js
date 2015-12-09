import {Property} from './property';

class SlotProperty extends Property {
    delegate = null;
    field;

    constructor(initialValue) {
        super();
        this.set(initialValue);
    }

    isInjectable() {
        return true;
    }

    get() {
        if (this.delegate !== null) {
            return this.delegate.value();
        }
        return this.field;
    }

    set(value) {
        let newValue;
        if (this.delegate !== null) {
            this.delegate.removeObserver(this);
        }
        if (value instanceof Property) {
            this.delegate = value;
            this.delegate.addObserver(this);
            newValue = this.delegate.value();
        } else {
            newValue = value;
        }
        if (this.field !== newValue) {
            this.field = newValue;
            this.markDirty();
        }
    }

    onNotify() {
        this.field = this.delegate.value();
        this.markDirty();
    }
}

export function slot(initialValue) {
    return new SlotProperty(initialValue);
}
