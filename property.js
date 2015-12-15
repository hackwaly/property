(function (exports) { 'use strict';

    var babelHelpers = {};

    babelHelpers.classCallCheck = function (instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    };

    babelHelpers.inherits = function (subClass, superClass) {
      if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      }

      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
      if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    };

    babelHelpers.possibleConstructorReturn = function (self, call) {
      if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      }

      return call && (typeof call === "object" || typeof call === "function") ? call : self;
    };

    babelHelpers;
    var dirtySeeds = new Set();
    var updateQueue = new Set();

    var scheduled = false;
    var fulfilled = Promise.resolve();
    var committing = false;

    function schedule() {
        if (!scheduled) {
            scheduled = true;
            fulfilled.then(commit);
        }
    }

    function mark(property) {
        dirtySeeds.add(property);
        schedule();
    }

    function queue(property) {
        updateQueue.add(property);
        schedule();
    }

    function commit() {
        if (committing) {
            return;
        }
        committing = true;
        while (dirtySeeds.size > 0 || updateQueue.size > 0) {
            while (dirtySeeds.size > 0) {
                var properties = dirtySeeds;
                dirtySeeds = new Set();
                properties.forEach(function (property) {
                    property.notifyObservers();
                });
            }
            while (updateQueue.size > 0) {
                var properties = updateQueue;
                updateQueue = new Set();
                properties.forEach(function (property) {
                    property.update();
                });
            }
        }
        committing = false;
        scheduled = false;
    }

    var stack = [];
    var frame = null;

    function track(property) {
        if (frame !== null) {
            frame.add(property);
        }
    }

    function evaluate(evaluator) {
        stack.push(frame);
        var dependencies = new Set();
        frame = dependencies;
        var value = evaluator();
        frame = stack.pop();
        return { value: value, dependencies: dependencies };
    }

    var Property = (function () {
        function Property() {
            babelHelpers.classCallCheck(this, Property);
            this.revision = 0;
            this.observers = [];
        }

        Property.prototype.isFinal = function isFinal() {
            return false;
        };

        Property.prototype.isWritable = function isWritable() {
            return true;
        };

        Property.prototype.isComputed = function isComputed() {
            return false;
        };

        Property.prototype.isInjectable = function isInjectable() {
            return false;
        };

        Property.prototype.isObserved = function isObserved() {
            return this.observers.length > 0;
        };

        Property.prototype.value = function value() {
            if (!this.isFinal()) {
                track(this);
            }
            return this.get();
        };

        Property.prototype.get = function get() {};

        Property.prototype.addObserver = function addObserver(observer) {
            if (this.isFinal()) {
                return;
            }
            this.observers.push(observer);
            if (this.observers.length <= 1) {
                this.enterObserved();
            }
        };

        Property.prototype.removeObserver = function removeObserver(observer) {
            if (this.isFinal()) {
                return;
            }
            var index = this.observers.indexOf(observer);
            if (index >= 0) {
                this.observers.splice(index, 1);
                if (this.observers.length <= 0) {
                    this.leaveObserved();
                }
            }
        };

        Property.prototype.notifyObservers = function notifyObservers() {
            var _this = this;

            this.observers.forEach(function (observer) {
                observer.onNotify(_this);
            });
            if (this.isFinal()) {
                this.observers = null;
            }
        };

        Property.prototype.enterObserved = function enterObserved() {};

        Property.prototype.leaveObserved = function leaveObserved() {};

        Property.prototype.markDirty = function markDirty() {
            this.revision++;
            mark(this);
        };

        return Property;
    })();

    function isProperty(obj) {
        return obj instanceof Property;
    }

    var ConstantProperty = (function (_Property) {
        babelHelpers.inherits(ConstantProperty, _Property);

        function ConstantProperty(value) {
            babelHelpers.classCallCheck(this, ConstantProperty);

            var _this = babelHelpers.possibleConstructorReturn(this, _Property.call(this));

            _this.field = value;
            return _this;
        }

        ConstantProperty.prototype.isFinal = function isFinal() {
            return true;
        };

        ConstantProperty.prototype.isWritable = function isWritable() {
            return false;
        };

        ConstantProperty.prototype.get = function get() {
            return this.field;
        };

        return ConstantProperty;
    })(Property);

    function constant(value) {
        return new ConstantProperty(value);
    }

    var StoredProperty = (function (_Property) {
        babelHelpers.inherits(StoredProperty, _Property);

        function StoredProperty(initialValue, filter) {
            babelHelpers.classCallCheck(this, StoredProperty);

            var _this = babelHelpers.possibleConstructorReturn(this, _Property.call(this));

            if (filter !== undefined) {
                _this.filter = filter;
            }
            _this.field = _this.filter(initialValue);
            return _this;
        }

        StoredProperty.prototype.filter = function filter(value) {
            return value;
        };

        StoredProperty.prototype.get = function get() {
            return this.field;
        };

        StoredProperty.prototype.set = function set(value) {
            if (this.filter !== undefined) {
                value = this.filter(value);
            }
            if (this.field !== value) {
                this.field = value;
                this.markDirty();
            }
        };

        return StoredProperty;
    })(Property);

    function stored(initialValue) {
        return new StoredProperty(initialValue);
    }

    var Flags_none = 0;
    var Flags_updated = 1;
    var Flags_evaluating = 2;
    var Flags_final = 4;

    var isDoingEnterObserved = false;

    var ComputedProperty = (function (_Property) {
        babelHelpers.inherits(ComputedProperty, _Property);

        function ComputedProperty(getter, setter) {
            babelHelpers.classCallCheck(this, ComputedProperty);

            var _this = babelHelpers.possibleConstructorReturn(this, _Property.call(this));

            _this.flags = Flags_none;
            _this.field = undefined;
            _this.dependencies = null;

            _this.getter = getter;
            if (setter !== undefined) {
                _this.setter = setter;
            }
            return _this;
        }

        ComputedProperty.prototype.isFinal = function isFinal() {
            return (this.flags & Flags_final) !== 0;
        };

        ComputedProperty.prototype.isWritable = function isWritable() {
            return this.setter !== undefined;
        };

        ComputedProperty.prototype.isComputed = function isComputed() {
            return true;
        };

        ComputedProperty.prototype.isPure = function isPure() {
            return false;
        };

        ComputedProperty.prototype.get = function get() {
            commit();
            if (!this.isObserved() && !isDoingEnterObserved) {
                return this.getter();
            }
            this.update();
            return this.field;
        };

        ComputedProperty.prototype.update = function update() {
            if ((this.flags & Flags_updated) !== 0) {
                return;
            }
            if ((this.flags & Flags_evaluating) !== 0) {
                throw new Error('Computed property with circular getter is not supported');
            }
            this.flags |= Flags_evaluating;

            var _dependencyDetection$ = evaluate(this.getter);

            var value = _dependencyDetection$.value;
            var dependencies = _dependencyDetection$.dependencies;

            this.flags &= ~Flags_evaluating;
            if (this.isPure() && dependencies.size <= 0) {
                this.flags |= Flags_final;
                this.getter = null;
                this.swapLinkedDependencies(this.dependencies, null, true);
            } else {
                this.swapLinkedDependencies(this.dependencies, dependencies, true);
            }

            var changed = false;
            if (this.field !== value) {
                this.field = value;
                changed = true;
            }

            this.flags |= Flags_updated;

            if (changed) {
                this.markDirty();
            }
        };

        ComputedProperty.prototype.swapLinkedDependencies = function swapLinkedDependencies(oldDependencies, newDependencies, update) {
            var _this2 = this;

            if (oldDependencies !== null) {
                oldDependencies.forEach(function (dependency) {
                    if (newDependencies === null || !newDependencies.has(dependency)) {
                        dependency.removeObserver(_this2);
                    }
                });
            }
            if (newDependencies !== null) {
                newDependencies.forEach(function (dependency) {
                    if (oldDependencies === null || !oldDependencies.has(dependency)) {
                        dependency.addObserver(_this2);
                    }
                });
            }
            if (update) {
                this.dependencies = newDependencies;
            }
        };

        ComputedProperty.prototype.set = function set(value) {
            if (this.setter === undefined) {
                throw new Error('Write to non-writable computed property');
            }
            this.setter(value);
        };

        ComputedProperty.prototype.enterObserved = function enterObserved() {
            var prev = isDoingEnterObserved;
            isDoingEnterObserved = true;
            this.update();
            isDoingEnterObserved = prev;
        };

        ComputedProperty.prototype.leaveObserved = function leaveObserved() {
            this.swapLinkedDependencies(this.dependencies, null, true);
            this.field = undefined;
            this.flags &= ~Flags_updated;
        };

        ComputedProperty.prototype.onNotify = function onNotify() {
            this.flags &= ~Flags_updated;
            if (this.observers.length > 0) {
                queue(this);
            }
        };

        return ComputedProperty;
    })(Property);

    var PureComputedProperty = (function (_ComputedProperty) {
        babelHelpers.inherits(PureComputedProperty, _ComputedProperty);

        function PureComputedProperty(getter) {
            babelHelpers.classCallCheck(this, PureComputedProperty);
            return babelHelpers.possibleConstructorReturn(this, _ComputedProperty.call(this, getter));
        }

        PureComputedProperty.prototype.isPure = function isPure() {
            return true;
        };

        return PureComputedProperty;
    })(ComputedProperty);

    function computed(getter, setter) {
        return new ComputedProperty(getter, setter);
    }

    function pure(getter) {
        return new PureComputedProperty(getter);
    }

    var SlotProperty = (function (_Property) {
        babelHelpers.inherits(SlotProperty, _Property);

        function SlotProperty(initialValue) {
            babelHelpers.classCallCheck(this, SlotProperty);

            var _this = babelHelpers.possibleConstructorReturn(this, _Property.call(this));

            _this.delegate = null;

            _this.set(initialValue);
            return _this;
        }

        SlotProperty.prototype.isInjectable = function isInjectable() {
            return true;
        };

        SlotProperty.prototype.get = function get() {
            if (this.delegate !== null) {
                return this.delegate.value();
            }
            return this.field;
        };

        SlotProperty.prototype.set = function set(value) {
            var newValue = undefined;
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
        };

        SlotProperty.prototype.onNotify = function onNotify() {
            this.field = this.delegate.value();
            this.markDirty();
        };

        return SlotProperty;
    })(Property);

    function slot(initialValue) {
        return new SlotProperty(initialValue);
    }

    function observe(property, callback) {
        var revision = NaN;
        var observer = {
            onNotify: function onNotify(property) {
                var value = property.value();
                if (property.revision !== revision) {
                    revision = property.revision;
                    callback(value);
                }
            },
            dispose: function dispose() {
                property.removeObserver(observer);
            }
        };
        property.addObserver(observer);
        observer.onNotify(property);
        return observer;
    }

    exports.isProperty = isProperty;
    exports.constant = constant;
    exports.stored = stored;
    exports.computed = computed;
    exports.pure = pure;
    exports.slot = slot;
    exports.observe = observe;

})((this.property = {}));