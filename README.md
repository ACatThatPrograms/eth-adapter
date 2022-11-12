# eth-adaper :electric_plug:

Ethereum development made easier, interact with smart contracts instantly.

### What this library helps with: :check:

- Reduce need for writing complex wrapper functions to call `ethers.js` or `web3.js`
- Reduce complexity around how to interact with smart contracts.
- Provided typed parameters are pre-generated functions based on your ABI:

![auto_complete_demo](https://github.com/ACatThatPrograms/eth-adapter/tree/main/readme_img/auto_complete.png)
#### Additionally: 
- Exposes ethers on `ethAdapter.ethers` if you need it
- Exposes all loaded contract configuration under `ethAdapter.contractConfig`


# About :grey_question:	

eth-adapter is a high level abstraction for interacting with deployed smart contracts through a web3 provider like Metamask.

Would you like to interact with smartcontracts like this:

```
// If you want to use metamask / injected web3
await ethAdapter.connectToWeb3Wallet();

// Or use a JSON Rpc Provider
ethAdapter.setJsonRpcProvider() // Used by default if you don't use connectToWeb3Wallet()

let storedInt = await ethAdapter.contractMethods.STORAGE.retrieve_view_IN0_OUT1();
if (storedInt.error) {
    // ...Handle it
}

// Else... you have storedInt now, conquer the world!
```

If the above looks pleasing, this library is for you.

# How do I use it? :wrench:

## Setup :sewing_needle:	

1. Compile a contract and get those artifact files as a `.json` file, ours is `Storage.json`
2. Drop them in your project in a new root `/artifacts` folder
   - Take note of the names, they're important. We have a **Storage.json** for example
3. Create a .env file and add your contract with an address
   `CONTRACT_ADDRESS_STORAGE=0x0`
   - If you use React, the library will also parse REACT_APP_ environment keys
   - The name should be uppercased here without the .json so **STORAGE**
4. Run 'ethpst' a bin provided by this library 
    - For React projects it is advised to edit start/build/test to have `ethpst;` preceed them:
  ```
      "scripts": {
        "start": "npx ethpst; react-scripts start",
        "build": "npx ethpst; react-scripts build",
        "test": "npx ethpst; react-scripts test",
        "eject": "react-scripts eject" // Not needed here
    }
  ```
  5. The Ethereum Pre-Start-Transpiler (ethpst) should be ran anytime changes to the contract abi's are made.

If you wish to use this inside node as ES5 and not ES6 modules, you can compile to cjs by including the following .env parameter in your project root:

`ETH_ADAPTER_USE_CJS="TRUE"`

* A false .env does not need to be included for ES6 Module compiling, it is the default.

## Calling Contracts :incoming_envelope:	

This is the easy part

```
// Import ethAdapter
import ethAdapter from 'eth-adapter`

// Set the JSON Rpc Provider
ethAdapter.setJsonRpcProvider("https://localhost:8545); 

// All methods are available on ethAdapter.contractMethods broken down by 'CONTRACTNAME' and have generated types for IntelliSense friendliness
let storedInt = ethAdapter.contractMethods.STORAGE.retrieve_view_IN0_OUT1();
```

Remember:

- Parameters for contract methods must be passed as destructured objects as `{paramName:value}`
- Additionally functions are named with IN/OUT counts to provide access to overloaded functions

## More Functionality :gear:	

EthAdapter has some inbuilts for basic things, and also gives you direct access to ethers if you need it through `ethAdapter.ethers`

### Additional Methods

These are currently quite alpha and used primarily internal of the adapter, however are available if needed

### **setOnNetworkChangeFunction(onNetworkFunction = (networkId: number) => {})**

Update the function to be ran anytime the network is updated on the provider
### **setOnAccountChangeFunction(onAccountChangeFunction = (activeAccount: string) => {})**

Update the function to be ran anytime the active account is changed on the provider
#### **setEqualizeFunction( () => {} )**

This function is used for the changing the function that is ran everytime ethAdapter changes it's own instance state. This can be beneficial if you integrate EthAdapter into a state management system such as redux.

#### **setJsonRpcProvider(url: string)**

Sets the JsonRPCProvider to be used by EthAdapter.

If you run this *after* connecting a web3 wallet, you will overwrite the injected provider.

#### **connectToWeb3Wallet( () => {})**

Used to connect to the injected web3 wallet. Callback is called with `{error: msg}` as the first parameter if there is a problem connecting or `{}` if successful.

#### **getAddressByIndex(accountIdx: int)**

Get the address by index for the connected provider

#### **updateEthereumBalance(accountIdx: int)** 

Updates the ethAdapter.balances state with the latest ETH balance for a given address

#### **signSimpleStringMsg(msg: string)**

Attempts to sign a simple message with signer.signMessage()

#### **signBytes (bytes: string)**

Attempts to sign bytes with signMessage

#### **_getReadonlyContractInstance(contractName: string)**

Will get an ethers read instance using the current provider of the CONTRACT_NAME as noted in the .env

`let storageInstance = await _getReadonlyContractInstance("STORAGE");`

#### **_getSignerContractInstance(contractName: string)**

Will get an ethers read instance using the current signer of the CONTRACT_NAME as noted in the .env

`let storageInstance = await _getSignerContractInstance("STORAGE");`

## Issues

Please submit issues/feature requests as needed 
