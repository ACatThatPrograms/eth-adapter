import { BigNumber } from "@ethersproject/bignumber";

export type uint8 = string | number;
export type uint16 = string | number;
export type uint32 = string | number;
export type uint64 = string | number;
export type uint128 = string | number;
export type uint256 = string | number;

export type bool = boolean;
export type address = string;

export type bytes = string;
export type bytes4 = string | number;
export type bytes8 = string | number;
export type bytes16 = string | number;
export type bytes32 = string;
export type bytesarray = string[];

export type ContractMethodResponse = {
    error: string | boolean,
    response:  string | number | BigNumber | boolean,
}