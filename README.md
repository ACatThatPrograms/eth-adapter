# eth-adaper :electric_plug:

Ethereum development made easier, interact with smart contracts instantly.

### Things you shouldn't be doing :no_entry_sign:

- Writing methods for reading Storage.sol. *Lame*.
- Instancing smart contracts at the ethers/web3.js level for basic calls. *It's the future*!
- Worrying about how to interact with smart contracts. *Worry = Sooner Death*
- Guessing what types to pass to a smart-contract. *Gross!*


### Things you should be doing: :check:

- Using eth-adapter :100:  

# About :grey_question:	

eth-adapter is a high level abstraction for interacting with deployed smart contracts through a web3 provider like Metamask.

Would you like to interact with smartcontracts like this:

```
// If you want to use metamask / injected web3
await ethAdapter.connectToWeb3Wallet();

// Or use a JSON Rpc Provider
ethAdapter.setJsonRpcProvider() // Used by default if you don't use connectToWeb3Wallet()

let storedInt = await ethAdapter.contractMethods.STORAGE.retrieve();
if (storedInt.error) {
    // ...Handle it
}

// Else... you have storedInt now, conquer the world!
```


If the above looks pleasing, this library is for you.

# How do I use it? :wrench:

## Setup :sewing_needle:	

### **Step 0:** 

**Install/USE YARN**

Due to npx's weirdness around 'cwd', yarn has been kinder to this somewhat odd transpiling process. To use this package you will need yarn for now until I dive back in and see what I can do on supporting npx. My apologies for the inconvenience and I welcome a PR on it.

### The rest of the steps:

0. Did you install/are you using yarn?
1. Compile a contract and get those artifact files
2. Drop them in your project in a new root `/artifacts` folder
   - Take note of the names, they're important. Lets pretend you have a **Storage.json**
3. Create a .env file and add your contract with an address
   `CONTRACT_ADDRESS_STORAGE=0x0`
   - If you use React, the library will also parse REACT_APP_ environment keys
   - The name should be uppercased here without the .json so **STORAGE**
4. Run 'ethpst' a bin provided by this library 
    - For React projects it is advised to edit start/build/test to have `ethpst;` preceed them:
  ```
      "scripts": {
        "start": "ethpst; react-scripts start",
        "build": "ethpst; react-scripts build",
        "test": "ethpst; react-scripts test",
        "eject": "react-scripts eject" // Not needed here
    }
  ```
  5. The Ethereum Pre-Start-Transpiler (ethpst) should be ran anytime changes to the contract abi's are made.

## Calling Contracts :incoming_envelope:	

This is the easy part

```
// Import ethAdapter
import ethAdapter from 'eth-adapter`

// Set the JSON Rpc Provider
ethAdapter.setJsonRpcProvider("https://localhost:8545); 

// All methods are available on ethAdapter.contractMethods broken down by contract
let storedInt = await ethAdapter.contractMethods.STORAGE.retreive()
```

Done.

## More Functionality :gear:	

EthAdapter has some inbuilts for basic things, and also gives you direct access to ethers if you need it through `ethAdapter.ethers`

## Issues

Please submit issues/feature requests as needed 
