import {
    ArraySchema,
    type AttributeSchema,
    booleanAttributeSchema,
    booleanValueSchema,
    ElementSchema,
    type Infer,
    numberAttributeSchema,
    numberValueSchema,
    ObjectSchema,
    type PropertySchema,
    stringAttributeSchema,
    stringValueSchema,
    type ValueSchema,
} from "./schema";

export * from "./error";
export type { Infer };

export function string(): ValueSchema<string>;

export function string(
    name: string,
    kind: "attribute",
): AttributeSchema<string, false>;

export function string(
    name: string,
    kind: "attribute",
    optional: false,
): AttributeSchema<string, false>;

export function string(
    name: string,
    kind: "attribute",
    optional: true,
): AttributeSchema<string, true>;

export function string<Optional extends boolean>(
    name: string,
    kind: "attribute",
    optional: Optional,
): AttributeSchema<string, Optional>;

export function string(
    name: string,
    kind: "element",
): ElementSchema<string, false>;

export function string(
    name: string,
    kind: "element",
    optional: false,
): ElementSchema<string, false>;

export function string(
    name: string,
    kind: "element",
    optional: true,
): ElementSchema<string, true>;

export function string<Optional extends boolean>(
    name: string,
    kind: "element",
    optional: Optional,
): ElementSchema<string, Optional>;

export function string<Optional extends boolean>(
    name?: string,
    kind?: "attribute" | "element",
    optional?: Optional,
):
    | AttributeSchema<string, Optional>
    | ValueSchema<string>
    | ElementSchema<string, Optional> {
    if (name !== undefined) {
        switch (kind) {
            case "attribute": {
                return stringAttributeSchema(name, optional as Optional);
            }
            case "element": {
                return new ElementSchema(
                    name,
                    stringValueSchema,
                    optional as Optional,
                );
            }
        }
    }
    return stringValueSchema;
}

export function number(): ValueSchema<number>;

export function number(
    name: string,
    kind: "attribute",
): AttributeSchema<number, false>;

export function number(
    name: string,
    kind: "attribute",
    optional: false,
): AttributeSchema<number, false>;

export function number(
    name: string,
    kind: "attribute",
    optional: true,
): AttributeSchema<number, true>;

export function number<Optional extends boolean>(
    name: string,
    kind: "attribute",
    optional: Optional,
): AttributeSchema<number, Optional>;

export function number(
    name: string,
    kind: "element",
): ElementSchema<number, false>;

export function number(
    name: string,
    kind: "element",
    optional: false,
): ElementSchema<number, false>;

export function number(
    name: string,
    kind: "element",
    optional: true,
): ElementSchema<number, true>;

export function number<Optional extends boolean>(
    name: string,
    kind: "element",
    optional: Optional,
): ElementSchema<number, Optional>;

export function number<Optional extends boolean>(
    name?: string,
    kind?: "attribute" | "element",
    optional?: Optional,
):
    | AttributeSchema<number, Optional>
    | ValueSchema<number>
    | ElementSchema<number, Optional> {
    if (name !== undefined) {
        switch (kind) {
            case "attribute": {
                return numberAttributeSchema(name, optional as Optional);
            }
            case "element": {
                return new ElementSchema(
                    name,
                    numberValueSchema,
                    optional as Optional,
                );
            }
        }
    }
    return numberValueSchema;
}

export function boolean(): ValueSchema<boolean>;

export function boolean(
    name: string,
    kind: "attribute",
): AttributeSchema<boolean, false>;

export function boolean(
    name: string,
    kind: "attribute",
    optional: false,
): AttributeSchema<boolean, false>;

export function boolean(
    name: string,
    kind: "attribute",
    optional: true,
): AttributeSchema<boolean, true>;

export function boolean<Optional extends boolean>(
    name: string,
    kind: "attribute",
    optional: Optional,
): AttributeSchema<boolean, Optional>;

export function boolean(
    name: string,
    kind: "element",
): ElementSchema<boolean, false>;

export function boolean(
    name: string,
    kind: "element",
    optional: false,
): ElementSchema<boolean, false>;

export function boolean(
    name: string,
    kind: "element",
    optional: true,
): ElementSchema<boolean, true>;

export function boolean<Optional extends boolean>(
    name: string,
    kind: "element",
    optional: Optional,
): ElementSchema<boolean, Optional>;

export function boolean<Optional extends boolean>(
    name?: string,
    kind?: "attribute" | "element",
    optional?: Optional,
):
    | AttributeSchema<boolean, Optional>
    | ValueSchema<boolean>
    | ElementSchema<boolean, Optional> {
    if (name !== undefined) {
        switch (kind) {
            case "attribute": {
                return booleanAttributeSchema(name, optional as Optional);
            }
            case "element": {
                return new ElementSchema(
                    name,
                    booleanValueSchema,
                    optional as Optional,
                );
            }
        }
    }
    return booleanValueSchema;
}

export function object<
    const T extends { [key in keyof S]: Infer<S[key]> },
    const S extends Record<string, PropertySchema>,
>(children: S): ObjectSchema<T, S>;

export function object<
    const T extends { [key in keyof S]: Infer<S[key]> },
    const S extends Record<string, PropertySchema>,
>(
    name: string,
    children: S,
): ElementSchema<{ [K in keyof T]: Infer<T[K]> }, false>;

export function object<
    const T extends { [key in keyof S]: Infer<S[key]> },
    const S extends Record<string, PropertySchema>,
>(
    name: string,
    children: S,
    optional: false,
): ElementSchema<{ [K in keyof T]: Infer<T[K]> }, false>;

export function object<
    const T extends { [key in keyof S]: Infer<S[key]> },
    const S extends Record<string, PropertySchema>,
>(
    name: string,
    children: S,
    optional: true,
): ElementSchema<{ [K in keyof T]: Infer<T[K]> }, true>;

export function object<
    const T extends { [key in keyof S]: Infer<S[key]> },
    const S extends Record<string, PropertySchema>,
    const Optional extends boolean,
>(
    name: string,
    children: S,
    optional: Optional,
): ElementSchema<{ [K in keyof T]: Infer<T[K]> }, Optional>;

export function object<
    const T extends { [key in keyof S]: Infer<S[key]> },
    const S extends Record<string, PropertySchema>,
    const Optional extends boolean,
>(
    nameOrChildren: string | S,
    children?: S,
    optional?: Optional,
): ObjectSchema<T, S> | ElementSchema<T, Optional> {
    if (typeof nameOrChildren === "string") {
        return new ElementSchema(
            nameOrChildren,
            new ObjectSchema<T, S>(children as S),
            optional as Optional,
        );
    } else {
        return new ObjectSchema(nameOrChildren);
    }
}

export function array<const T>(
    schema: ValueSchema<T>,
): ArraySchema<T, false, false>;

export function array<const T>(
    schema: ValueSchema<T>,
    optional: false,
): ArraySchema<T, false, false>;

export function array<const T>(
    schema: ValueSchema<T>,
    optional: true,
): ArraySchema<T, false, true>;

export function array<const T, const Optional extends boolean>(
    schema: ValueSchema<T>,
    optional: Optional,
): ArraySchema<T, false, Optional>;

export function array<
    const T extends { [key in keyof S]: Infer<S[key]> },
    const S extends Record<string, PropertySchema>,
>(schema: ObjectSchema<T, S>): ArraySchema<T, false, false>;

export function array<
    const T extends { [key in keyof S]: Infer<S[key]> },
    const S extends Record<string, PropertySchema>,
>(schema: ObjectSchema<T, S>, optional: false): ArraySchema<T, false, false>;

export function array<
    const T extends { [key in keyof S]: Infer<S[key]> },
    const S extends Record<string, PropertySchema>,
>(schema: ObjectSchema<T, S>, optional: true): ArraySchema<T, false, true>;

export function array<
    const T extends { [key in keyof S]: Infer<S[key]> },
    const S extends Record<string, PropertySchema>,
    const Optional extends boolean,
>(
    schema: ObjectSchema<T, S>,
    optional: Optional,
): ArraySchema<T, false, Optional>;

export function array<const T>(
    schema: ArraySchema<T, false, false>,
): ArraySchema<T, false, false>;

export function array<const T>(
    name: string,
    schema: ArraySchema<T, false, false> | ValueSchema<T>,
): ArraySchema<T, true, false>;

export function array<const T>(
    name: string,
    schema: ArraySchema<T, false, false> | ValueSchema<T>,
): ArraySchema<T, true, false>;

export function array<const T>(
    name: string,
    schema: ArraySchema<T, false, false> | ValueSchema<T>,
    optional: false,
): ArraySchema<T, true, false>;

export function array<const T>(
    name: string,
    schema: ArraySchema<T, false, false> | ValueSchema<T>,
    optional: true,
): ArraySchema<T, true, true>;

export function array<const T, const Optional extends boolean>(
    name: string,
    schema: ArraySchema<T, false, false> | ValueSchema<T>,
    optional: Optional,
): ArraySchema<T, true, Optional>;

export function array<
    const T extends { [key in keyof S]: Infer<S[key]> },
    const S extends Record<string, PropertySchema>,
>(name: string, schema: S): ArraySchema<T, true, false>;

export function array<
    const T extends { [key in keyof S]: Infer<S[key]> },
    const S extends Record<string, PropertySchema>,
>(name: string, schema: S, optional: false): ArraySchema<T, true, false>;

export function array<
    const T extends { [key in keyof S]: Infer<S[key]> },
    const S extends Record<string, PropertySchema>,
>(name: string, schema: S, optional: true): ArraySchema<T, true, true>;

export function array<
    const T extends { [key in keyof S]: Infer<S[key]> },
    const S extends Record<string, PropertySchema>,
    const Optional extends boolean,
>(name: string, schema: S, optional: Optional): ArraySchema<T, true, Optional>;

export function array<
    const T extends { [key in keyof S]: Infer<S[key]> },
    const S extends Record<string, PropertySchema>,
    const Optional extends boolean,
>(
    nameOrSchema:
        | string
        | ValueSchema<T>
        | ArraySchema<T, false, false>
        | ObjectSchema<T, S>,
    schemaOrOptional?:
        | ArraySchema<T, false, false>
        | ValueSchema<T>
        | ObjectSchema<T, S>
        | Optional,
    optional?: Optional,
): ArraySchema<T, boolean, Optional> {
    if (typeof nameOrSchema === "string") {
        // @ts-expect-error
        return new ArraySchema(
            nameOrSchema,
            // @ts-expect-error
            schemaOrOptional,
            optional,
        );
    } else {
        // @ts-expect-error
        return new ArraySchema(
            undefined,
            // @ts-expect-error
            nameOrSchema,
            schemaOrOptional,
        );
    }
}
