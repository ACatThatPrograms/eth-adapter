import { TransactionResponse } from "@ethersproject/abstract-provider/lib/index";

export type uint8 = string | number;
export type uint16 = string | number;
export type uint32 = string | number;
export type uint64 = string | number;
export type uint96 = string | number;
export type uint128 = string | number;
export type uint256 = string | number;

export type uint256array = Array<uint256>

export type bool = boolean;
export type address = string;

export type bytes = string;
export type bytes4 = string | number;
export type bytes8 = string | number;
export type bytes16 = string | number;
export type bytes32 = string;
export type bytesarray = string[];

export type tuplearray = Array<2>[];

export type ContractReadMethodResponse = {
    error: string | boolean,
}

interface ContractWriteError {
    error: string
}

export type ContractWriteMethodResponse = TransactionResponse | ContractWriteError;