import {
    ArraySchema,
    type AttributeSchema,
    booleanAttributeSchema,
    booleanValueSchema,
    ElementSchema,
    numberAttributeSchema,
    numberValueSchema,
    ObjectSchema,
    type Schema,
    stringAttributeSchema,
    stringValueSchema,
    type ValueSchema,
} from "./schema";

export * from "./error";

export type Infer<S> = S extends Schema<infer T, boolean> ? T : never;

export function string(): ValueSchema<string>;

export function string<Optional extends boolean = false>(
    name: string,
    kind: "attribute",
    optional?: Optional,
): AttributeSchema<string, Optional>;

export function string<Optional extends boolean = false>(
    name: string,
    kind: "element",
    optional?: Optional,
): ElementSchema<string, Optional>;

export function string<Optional extends boolean = false>(
    name?: string,
    kind?: "attribute" | "element",
    optional?: Optional,
):
    | AttributeSchema<string, Optional>
    | ValueSchema<string>
    | ElementSchema<string, Optional> {
    if (name !== undefined) {
        if (kind === "attribute") {
            return stringAttributeSchema(name, optional as Optional);
        } else if (kind === "element") {
            return new ElementSchema(
                name,
                stringValueSchema,
                optional as Optional,
            );
        }
    }
    return stringValueSchema;
}

export function number(): ValueSchema<number>;

export function number<Optional extends boolean = false>(
    name: string,
    kind: "attribute",
    optional?: Optional,
): AttributeSchema<number, Optional>;

export function number<Optional extends boolean = false>(
    name: string,
    kind: "element",
    optional?: Optional,
): ElementSchema<number, Optional>;

export function number<Optional extends boolean = false>(
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

export function boolean<Optional extends boolean = false>(
    name: string,
    kind: "attribute",
    optional?: Optional,
): AttributeSchema<boolean, Optional>;

export function boolean<Optional extends boolean = false>(
    name: string,
    kind: "element",
    optional?: Optional,
): ElementSchema<boolean, Optional>;

export function boolean<Optional extends boolean = false>(
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
    S extends Record<
        string,
        | AttributeSchema<unknown, boolean>
        | ElementSchema<unknown, boolean>
        | ArraySchema<unknown, true, boolean>
    >,
>(children: S): ObjectSchema<{ [K in keyof S]: Infer<S[K]> }>;

export function object<
    S extends Record<
        string,
        | AttributeSchema<unknown, boolean>
        | ElementSchema<unknown, boolean>
        | ArraySchema<unknown, true, boolean>
    >,
    Optional extends boolean = false,
>(
    name: string,
    children: S,
    optional?: Optional,
): ElementSchema<{ [K in keyof S]: Infer<S[K]> }, Optional>;

export function object<
    S extends Record<
        string,
        | AttributeSchema<unknown, boolean>
        | ElementSchema<unknown, boolean>
        | ArraySchema<unknown, true, boolean>
    >,
    Optional extends boolean = false,
>(
    nameOrChildren: string | S,
    children?: S,
    optional?: Optional,
):
    | ObjectSchema<{ [K in keyof S]: Infer<S[K]> }>
    | ElementSchema<{ [K in keyof S]: Infer<S[K]> }, Optional> {
    if (typeof nameOrChildren === "string") {
        return new ElementSchema(
            nameOrChildren as string,
            new ObjectSchema(children as S),
            optional as Optional,
        ) as ElementSchema<{ [K in keyof S]: Infer<S[K]> }, Optional>;
    } else {
        return new ObjectSchema(nameOrChildren as S) as ObjectSchema<{
            [K in keyof S]: Infer<S[K]>;
        }>;
    }
}

export function array<T, Optional extends boolean = false>(
    schema: ValueSchema<T>,
    optional?: Optional,
): ArraySchema<T, false, Optional>;

export function array<
    T extends Record<string, unknown>,
    Optional extends boolean = false,
>(
    schema: ObjectSchema<T>,
    optional?: Optional,
): ArraySchema<T, false, Optional>;

export function array<T, Optional extends boolean = false>(
    schema: ArraySchema<T, false, Optional>,
    optional?: Optional,
): ArraySchema<T, false, Optional>;

export function array<T, Optional extends boolean = false>(
    name: string,
    schema: ArraySchema<T, false, Optional> | ValueSchema<T>,
    optional?: Optional,
): ArraySchema<T, true, Optional>;

export function array<
    T extends Record<string, unknown>,
    Optional extends boolean = false,
>(
    name: string,
    schema: ObjectSchema<T>,
    optional?: Optional,
): ArraySchema<T, true, Optional>;

export function array<T, Optional extends boolean = false>(
    nameOrSchema: string | Schema<T, boolean>,
    schemaOrOptional?: Schema<T, boolean> | Optional,
    optional?: Optional,
): ArraySchema<T, boolean, Optional> {
    if (typeof nameOrSchema === "string") {
        return new ArraySchema(
            nameOrSchema as string,
            schemaOrOptional as Schema<T, boolean>,
            optional as Optional,
        );
    } else {
        return new ArraySchema(
            undefined,
            nameOrSchema as Schema<T, boolean>,
            schemaOrOptional as Optional,
        );
    }
}
