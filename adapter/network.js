/**
 * @enum { String } - Ethereum network names by NAME => String
 */
 export const ETHEREUM_NETWORK_NAMES = {
    ETHEREUM_MAINNET: "Ethereum Mainnet",
    ROPSTEN_TESTNET: "Ropsten",
    KOVAN_TESTNET: "Kovan",
    RINKEBY_TESTNET: "Rinkeby",
    GOERLI_TESTNET: "Goerli"
}

/**
 * @enum { String } - Ethereum networks by ID => NetworkName
 */
export const ETHEREUM_NETWORK_BY_ID = {
    "1": ETHEREUM_NETWORK_NAMES.ETHEREUM_MAINNET,
    "3": ETHEREUM_NETWORK_NAMES.ROPSTEN_TESTNET,
    "42": ETHEREUM_NETWORK_NAMES.KOVAN_TESTNET,
    "4": ETHEREUM_NETWORK_NAMES.RINKEBY_TESTNET,
    "5": ETHEREUM_NETWORK_NAMES.GOERLI_TESTNET
}