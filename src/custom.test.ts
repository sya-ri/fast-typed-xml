import * as tx from "./index";
import { AttributeSchema, ElementSchema, ValueSchema } from "./schema";

type UserState = "active" | "inactive";

const parseUserState = (v: string): UserState => {
    switch (v) {
        case "active":
        case "inactive":
            return v;
        default:
            throw new Error(`Invalid user state: ${v}`);
    }
};

const userStateAttributeSchema = <Optional extends boolean>(
    name: string,
    optional: Optional,
) => new AttributeSchema<UserState, Optional>(name, optional, parseUserState);

const userStateValueSchema = new ValueSchema<UserState>(parseUserState);

function userState(): ValueSchema<UserState>;

function userState(
    name: string,
    kind: "attribute",
): AttributeSchema<UserState, false>;

function userState(
    name: string,
    kind: "attribute",
    optional: false,
): AttributeSchema<UserState, false>;

function userState(
    name: string,
    kind: "attribute",
    optional: true,
): AttributeSchema<UserState, true>;

function userState<Optional extends boolean>(
    name: string,
    kind: "attribute",
    optional: Optional,
): AttributeSchema<UserState, Optional>;

function userState(
    name: string,
    kind: "element",
): ElementSchema<UserState, false>;

function userState(
    name: string,
    kind: "element",
    optional: false,
): ElementSchema<UserState, false>;

function userState(
    name: string,
    kind: "element",
    optional: true,
): ElementSchema<UserState, true>;

function userState<Optional extends boolean>(
    name: string,
    kind: "element",
    optional: Optional,
): ElementSchema<UserState, Optional>;

function userState<Optional extends boolean>(
    name?: string,
    kind?: "attribute" | "element",
    optional?: Optional,
):
    | AttributeSchema<UserState, Optional>
    | ValueSchema<UserState>
    | ElementSchema<UserState, Optional> {
    if (name !== undefined) {
        switch (kind) {
            case "attribute": {
                return userStateAttributeSchema(name, optional as Optional);
            }
            case "element": {
                return new ElementSchema(
                    name,
                    userStateValueSchema,
                    optional as Optional,
                );
            }
        }
    }
    return userStateValueSchema;
}

describe("custom schema", () => {
    it("should parse a user state element", () => {
        const schema = tx.object({
            state: userState("state", "element"),
        });
        const actual = schema.parse("<user><state>active</state></user>");
        expect(actual).toEqual({
            state: "active",
        });
    });
});
