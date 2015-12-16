declare module "property" {
	interface TProperty<TValue> {
		(): TValue;
		version: number;
		isFinal(): boolean;
		isWritable(): boolean;
		isComputed(): boolean;
		isInjectable(): boolean;
	}
	interface TWritableProperty<TValue> extends TProperty<TValue> {
		set(value: TValue): void;
	}
	interface TInjectableProperty<TValue> extends TProperty<TValue> {
		set(value: TValue): void;
		set(value: TProperty<TValue>): void;
	}
	interface TDisposable {
		dispose(): void;
	}
	function isProperty(obj: any): obj is TProperty<any>;
	function constant<TValue>(value: TValue): TProperty<TValue>;
	function stored<TValue>(initialValue: TValue, filter?: (value: TValue) => TValue): TWritableProperty<TValue>;
	function computed<TValue>(getter: () => TValue): TProperty<TValue>;
	function computed<TValue>(getter: () => TValue, setter: (value: TValue) => void): TWritableProperty<TValue>;
	function slot<TValue>(initialValue: TValue): TInjectableProperty<TValue>;
	function slot<TValue>(initialValue: TProperty<TValue>): TInjectableProperty<TValue>;
	function observe<TValue>(property: TProperty<TValue>, callback: (value: TValue) => void): TDisposable;
}
