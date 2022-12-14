/**
 * ethAdapter.ts IS THE EthAdapter TEMPLATE that is used during the generator/transpile process
 * Only generic changes should take place here that are contract abstract
 * The generator scripts will create customEthAdapter.ts that have all build/transpiled functions
 */

import { ETHEREUM_NETWORK_BY_ID } from "./network";
import { ethers, Signer } from "ethers";
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import CONTRACT_CONFIGURATION from "./config";
import * as types from "../../@types";

// Allow window.ethereum
declare global {
    interface Window {
        ethereum?: any;
    }
}

// Is the ethAdapter instanced?
let ethAdapterIsInstanced: boolean = false;

/**
 * @class Ethereum Adapter
 * @classdesc Used to interact with the browser's web3 wallet
 * for signing transactions and making actions against the connected blockchain. Should be treated as singleton.
 */
class EthAdapter {
    accounts: string[];
    balances: object;
    balancesLoading: boolean;
    connected: boolean;
    connectedAccount: string | number;
    connecting: boolean;
    contractConfig: object;
    contractMethods: object;
    ethers: typeof ethers;
    onNetworkChange: (networkId: number) => void = () => {};
    onAccountChange: (activeAccount: string) => void = () => {};
    equalize: Function;
    networkId: string;
    networkName: string;
    provider: Web3Provider | JsonRpcProvider;
    signer: Signer;

    constructor() {
        // Prevent multiple-instances
        if (ethAdapterIsInstanced) {
            throw new Error(
                "Do not instance EthAdapter more than once. Use the already existing instance that is exported from eth-adapter"
            );
        }
        ethAdapterIsInstanced = true;

        // Mutating instance state
        this.accounts = [];
        this.connected = false;
        this.connecting = false;
        this.connectedAccount = "";
        this.balances = {};
        this.balancesLoading = false;
        this.networkId = "";
        this.networkName = "";

        // Static instance state
        this.ethers = ethers; // ethers.js passthrough
        this.equalize = () => {};
        this.onNetworkChange = (networkId: number) => {};
        this.onAccountChange = (activeAccount: string) => {};
        this.provider = null; // Web3 Provider -- Populated on successful _connectToWeb3Wallet()
        this.signer = null; // Web3 Signer -- Populated on successful _connectToWeb3Wallet()

        this.contractMethods = null;
        this.contractConfig = CONTRACT_CONFIGURATION;
    }

    /**
     * Update the function to call when state should be equalized
     * This function is called anytime notable instance state is updated
     * @param {function} equalizerFx - Function to be used to be called when notable "this" state is updated
     */
    setEqualizeFunction(equalizerFx: Function) {
        this.equalize = equalizerFx;
    }

    /**
     * Used to set the function call after a network change has taken place
     */
    setOnNetworkChangeFunction(onNetworkFunction = (networkId: number) => {}) {
        this.onNetworkChange = onNetworkFunction;
    }

    setOnAccountChangeFunction(onAccountChangeFunction = (activeAccount: string) => {}) {
        this.onAccountChange = onAccountChangeFunction;
    }

    /**
     * Updates this.provider of EthAdapter so pre-connect RPC requests can be made
     * @param {string} url - Url to set JSONRpc provider to
     */
    setJsonRpcProvider(url: string) {
        this.provider = new ethers.providers.JsonRpcProvider(url);
    }

    /**
     * Attempt to connect to a Web3 Wallet from window.ethereum
     * @param { Function } web3ConnectCallback - Callback to run after a connection contains err if error
     */
    async connectToWeb3Wallet(web3ConnectCallback: Function = () => {}) {
        this.connecting = true;
        this.equalize();
        if (!window.ethereum) {
            return { error: "No web3 wallet detected." };
        }
        try {
            this.provider = new ethers.providers.Web3Provider(window.ethereum, "any"); // Establish connection to injected wallet
            this.accounts = await this.provider.send("eth_requestAccounts", []); // Request accounts
            this.signer = this.provider.getSigner(); // Get the signer
            this.networkId = window.ethereum.chainId;
            let address = await this.getAddressByIndex(0);
            this.connectedAccount = address;
            this.connected = true;
            this.updateEthereumBalance(0);
            this._setupWeb3Listeners(); // Setup listeners for injected web3 wallet
            web3ConnectCallback();
            this.connecting = false;
            this.equalize();
            console.debug("EthAdapter Connected: ", this);
        } catch (ex) {
            console.error(ex);
            this.connecting = false;
            this.equalize();
            return web3ConnectCallback({ error: ex.message });
        }
    }

    /**
     * Setup web3 listeners for connected web3Wallet state changes
     */
    async _setupWeb3Listeners() {
        if (window.ethereum) {
            window.ethereum.on("networkChanged", async (networkId) => {
                this.networkId = networkId;
                this.networkName = ETHEREUM_NETWORK_BY_ID[networkId];
                await this.updateEthereumBalance();
                this.equalize();
                this.onNetworkChange(networkId);
            });
            window.ethereum.on("accountsChanged", async (accounts) => {
                this.accounts = accounts;
                let address = this.getAddressByIndex(0);
                this.connectedAccount = address;
                await this.updateEthereumBalance();
                this.equalize();
                this.onAccountChange(address);
            });
        } else {
            console.warn("No web3 detected."); // TODO: Add fallback
        }
    }

    /**
     * Get address from accounts[index] or return 0 if empty.
     * @param { Number } index - Index to get from this.accounts
     */
    getAddressByIndex(index = 0): string {
        let accounts = this.accounts;
        return accounts.length > 0 ? accounts[index] : "";
    }

    /**
     * Returns an ethers.js contract instance that has been instanced without a signer for read-only calls
     * @param {ContractName} contractName - One of the available contract name strings from this.configuration
     */
    _getReadonlyContractInstance(contractName: string) {
        this._requireContractExists(contractName);
        this._requireContractAddress(contractName);
        this._requireContractAbi(contractName);
        return new ethers.Contract(
            CONTRACT_CONFIGURATION[contractName].address,
            CONTRACT_CONFIGURATION[contractName].abi,
            this.provider
        );
    }

    /**
     * Returns an ethers.js contract instance that has been instanced with a signer ( this.signer )
     * @param {ContractName} contractName - One of the available contract name strings from this.configuration
     */
    _getSignerContractInstance(contractName: string) {
        this._requireContractExists(contractName);
        this._requireContractAddress(contractName);
        this._requireContractAbi(contractName);
        this._requireSigner(contractName);
        return new ethers.Contract(
            CONTRACT_CONFIGURATION[contractName].address,
            CONTRACT_CONFIGURATION[contractName].abi,
            this.signer
        );
    }

    /**
     * @param { Number } accountIndex - Account index of this.accounts[i] to check balance for
     */
    async updateEthereumBalance(accountIndex: number = 0) {
        if (isNaN(accountIndex)) {
            throw new Error("updateEthereumBalance() can only be called with a number");
        }
        try {
            this.balancesLoading = true;
            this.equalize();
            let balance = await this.provider.getBalance(this.getAddressByIndex(accountIndex));
            this.balances = {
                ...this.balances,
                ethereum: parseFloat(ethers.utils.formatEther(balance)).toFixed(4),
            };
            this.equalize();
        } catch (ex) {
            return { error: ex.message };
        }
    }

    async _throw(msg) {
        throw new Error("eth/ethAdaper.js: " + msg);
    }

    /** Internal contract settings requirement helper for contract functions */
    _requireContractExists(contractName: string) {
        if (!CONTRACT_CONFIGURATION[contractName]) {
            this._throw(
                "Contract this.configuration for contract '" +
                    contractName +
                    "' nonexistant. Verify contract has been set in .env"
            );
        }
    }

    /** Internal ABI requirement helper for contract functions */
    _requireContractAbi(contractName: string) {
        if (!CONTRACT_CONFIGURATION[contractName].abi) {
            this._throw(
                "Requesting contract instance for contract '" +
                    contractName +
                    "' with nonexistant abi. Verify ABI has been set."
            );
        }
    }

    /** Internal contract address requirement helper for contract functions */
    _requireContractAddress(contractName: string) {
        if (!CONTRACT_CONFIGURATION[contractName].address) {
            this._throw(
                "Requesting contract instance for contract '" +
                    contractName +
                    "' with nonexistant address. Verify address has been set."
            );
        }
    }

    /** Internal signer requirement helper for contract functions */
    _requireSigner(contractName: string) {
        if (!this.signer) {
            this._throw(
                "Requesting contract instance for contract '" +
                    contractName +
                    "' but EthAdapter has not been provided a signer. Verify a signer has been set."
            );
        }
    }

    /** Sign a simple string with this.signer
     * @param {String} message - The string to sign
     * @returns { String } -- Signed message
     */
    async signSimpleStringMessage(message: string): Promise<string> {
        this._requireSigner("fx_signSimpleStringMessage");
        return await this.signer.signMessage(message);
    }

    /** Signs the bytes of message with this.signer.signMessage -- Useful for signing hashes
     * @param {String} message - The string to sign
     * @returns { String } -- Signed message
     */
    async signBytes(message: string): Promise<string> {
        this._requireSigner("fx_signBytes");
        const msgBytes = ethers.utils.arrayify(message);
        return await this.signer.signMessage(msgBytes);
    }

    /**
     * Attempt a call on a contract method
     * @param {ContractName} contractName - One of the available contract name strings from this.configuration
     * @param {String} methodName - Exact smart contract method name as a string
     * @param {Array} paramaters - Contract method parameters as an array
     * @param {Boolean} parseBN - Should BigNumber return values be parsed? Defaults TRUE
     */
    async _tryCall(contractName: string, methodName: string, params: string | number[] = [], parseBN: boolean = true) {
        try {
            let contract = this._getReadonlyContractInstance(contractName);
            let result = await contract[methodName]([...params]);
            // If return is a BN parse and return the value string, else just return
            if (ethers.BigNumber.isBigNumber(result) && parseBN) {
                return result.toString();
            }
            return result;
        } catch (ex) {
            return { error: ex.message };
        }
    }

    /**
     * Attempt a send on a contract method
     * @param {ContractName} contractName - One of the available contract name strings from this.configuration
     * @param {String} methodName - Exact smart contract method name as a string
     * @param {Array} paramaters - Contract method parameters as an array
     */
    async _trySend(contractName: string, methodName: string, params: string | number[] = []) {
        try {
            return await this._getSignerContractInstance(contractName)[methodName]([...params]);
        } catch (ex) {
            return { error: ex.message };
        }
    }
}

let ethAdapter = new EthAdapter();

// !! GENERATED FUNCTIONS BELOW HERE

export default ethAdapter;
