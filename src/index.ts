import {
    ArraySchema,
    BooleanAttributeSchema,
    BooleanElementSchema,
    type Infer,
    NumberAttributeSchema,
    NumberElementSchema,
    ObjectSchema,
    type OptionalSchema,
    RequiredSchema,
    type RootableSchema,
    type Schema,
    StringAttributeSchema,
    StringElementSchema,
} from "./schema";

export * from "./error";
export {
    type NodeLike,
    type ParseOptions,
    parse,
    parseStream,
} from "./parser";
export type {
    Infer,
    OptionalSchema,
    RootableSchema,
    Schema,
} from "./schema";

export type Kind = "attribute" | "element";

export const string = <Optional extends boolean = false>(
    kind: Kind,
    name: string,
    optional: Optional = false as Optional,
): Optional extends true ? OptionalSchema<string> : Schema<string> => {
    const base =
        kind === "attribute"
            ? new StringAttributeSchema(name)
            : new StringElementSchema(name);
    return optional
        ? // @ts-expect-error Returns OptionalSchema<string> when Optional = true
          base
        : new RequiredSchema(base);
};

export const number = <Optional extends boolean = false>(
    kind: Kind,
    name: string,
    optional: Optional = false as Optional,
): Optional extends true ? OptionalSchema<number> : Schema<number> => {
    const base =
        kind === "attribute"
            ? new NumberAttributeSchema(name)
            : new NumberElementSchema(name);
    return optional
        ? // @ts-expect-error Returns OptionalSchema<number> when Optional = true
          base
        : new RequiredSchema(base);
};

export const boolean = <Optional extends boolean = false>(
    kind: Kind,
    name: string,
    optional: Optional = false as Optional,
): Optional extends true ? OptionalSchema<boolean> : Schema<boolean> => {
    const base =
        kind === "attribute"
            ? new BooleanAttributeSchema(name)
            : new BooleanElementSchema(name);
    return optional
        ? // @ts-expect-error Returns OptionalSchema<boolean> when Optional = true
          base
        : new RequiredSchema(base);
};

export const object = <S extends Record<string, Schema<unknown>>>(
    children: S,
): RootableSchema<{ [K in keyof S]: Infer<S[K]> }> => {
    return new ObjectSchema(children);
};

export const array = <S extends Record<string, Schema<unknown>>>(
    children: S,
): RootableSchema<{ [K in keyof S]: Infer<S[K]> }[]> => {
    return new ArraySchema(children);
};
