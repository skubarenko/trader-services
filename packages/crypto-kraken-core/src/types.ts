export interface CurrencyPair {
    0: string;
    1: string;
}

export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends Array<infer U> ? ReadonlyArray<DeepReadonly<U>> : DeepReadonly<T[P]>;
};

export type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
};

export type FieldsSelector<T> = {
    [P in keyof T]?: T[P] extends Array<infer U> ?
    FieldsSelector<U> | true : (T[P] extends object ? FieldsSelector<T[P]> | true : true);
};

export type FieldsSelectorMapper<Type, Selector, UncheckedType = any> = {
    [P in keyof Type]: Type[P] extends Array<infer U> ?
    (P extends keyof Selector ?
        (Selector[P] extends true ? U[] : Array<FieldsSelectorMapper<U, Selector[P], UncheckedType>>) : UncheckedType) :
    (P extends keyof Selector ?
        (Selector[P] extends true ? Type[P] :
            FieldsSelectorMapper<Type[P], Selector[P], UncheckedType>) : UncheckedType);
};

export type FieldsSelectorResult<Type, Selector extends FieldsSelector<Type>, UncheckedType = any> =
    FieldsSelectorMapper<Type, Selector, UncheckedType>;
