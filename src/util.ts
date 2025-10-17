import { InvalidInputError } from "./error";
import type { NodeLike } from "./parser";

export const getChild = <Single extends boolean>(
    node: NodeLike,
    name: string,
    single: Single,
): (Single extends true ? NodeLike : NodeLike[]) | undefined => {
    const match = node.children?.filter((v) => v.name === name);
    if (single) {
        if (match === undefined) {
            return undefined;
        }

        const length = match.length;
        if (1 < length) {
            throw new InvalidInputError(
                `Expected zero or one element (found ${length}): ${name}`,
            );
        }

        // @ts-expect-error returns a single element when single is true
        return match[0];
    }

    // @ts-expect-error returns multiple elements when single is false
    return match;
};

export const parseNumberOrFail = (value: string): number => {
    const num = Number(value);
    if (Number.isNaN(num)) {
        throw new InvalidInputError(`Invalid number: ${value}`);
    }
    return num;
};

export const parseBooleanOrFail = (value: string): boolean => {
    if (value === "true") return true;
    if (value === "false") return false;
    throw new InvalidInputError(`Invalid boolean: ${value}`);
};
