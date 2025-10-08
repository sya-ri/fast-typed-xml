import { InvalidInputError } from "./error";
import type { NodeLike } from "./parser";
import {
    getAttribute,
    getElement,
    parseBooleanOrFail,
    parseNumberOrFail,
} from "./util";

export interface Schema<T> {
    decode: (node: NodeLike) => T;
}

export type OptionalSchema<T> = Schema<T | undefined>;

export class RequiredSchema<T> implements Schema<T> {
    constructor(private readonly schema: Schema<T | undefined>) {}

    decode: (node: NodeLike) => T = (node) => {
        const value = this.schema.decode(node);
        if (value === undefined) {
            throw new InvalidInputError("Missing required value");
        }
        return value;
    };
}

export class StringAttributeSchema implements Schema<string | undefined> {
    constructor(private readonly name: string) {}

    decode(node: NodeLike): string | undefined {
        return getAttribute(node, this.name);
    }
}

export class StringElementSchema implements Schema<string | undefined> {
    constructor(private readonly name: string) {}

    decode(node: NodeLike): string | undefined {
        return getElement(node, this.name);
    }
}

export class NumberAttributeSchema implements Schema<number | undefined> {
    constructor(private readonly name: string) {}

    decode(node: NodeLike): number | undefined {
        const value = getAttribute(node, this.name);
        if (value === undefined) return undefined;
        return parseNumberOrFail(value);
    }
}

export class NumberElementSchema implements Schema<number | undefined> {
    constructor(private readonly name: string) {}

    decode(node: NodeLike): number | undefined {
        const value = getElement(node, this.name);
        if (value === undefined) return undefined;
        return parseNumberOrFail(value);
    }
}

export class BooleanAttributeSchema implements Schema<boolean | undefined> {
    constructor(private readonly name: string) {}

    decode(node: NodeLike): boolean | undefined {
        const value = getAttribute(node, this.name);
        if (value === undefined) return undefined;
        return parseBooleanOrFail(value);
    }
}

export class BooleanElementSchema implements Schema<boolean | undefined> {
    constructor(readonly name: string) {}

    decode(node: NodeLike): boolean | undefined {
        const value = getElement(node, this.name);
        if (value === undefined) return undefined;
        return parseBooleanOrFail(value);
    }
}
