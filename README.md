# Conflux Voting dApp

A simple gas-sponsored voting dApp built on Conflux Core testnet.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_CONFLUX_RPC_URL=https://test.confluxrpc.com
NEXT_PUBLIC_NETWORK_ID=1
```

3. Compile contract:
```bash
npm run compile
```

4. Deploy to testnet:
```bash
npm run deploy:testnet
```

5. Add contract address to `.env`:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=cfxtest:...
```

6. Run the app:
```bash
npm run dev
```

## Usage

1. Install [Fluent Wallet](https://fluentwallet.com)
2. Get testnet CFX from [Conflux Faucet](https://faucet.confluxnetwork.org)
3. Connect wallet
4. Enter contract address and load
5. Create proposals and vote!

## Setting Up Gas Sponsorship

The Contract Read&Write Tool allows users to interact with smart contracts. Any verified contract on ConfluxScan can utilize this tool to read or write data.

- **Mainnet SponsorWhitelistControl Read&Write Tool**: [Mainnet Tool](https://confluxscan.io/contract/sponsorwhitelistcontrol)
- **Testnet SponsorWhitelistControl Read&Write Tool**: [Testnet Tool](https://testnet.confluxscan.io/contract/sponsorwhitelistcontrol)

### Preparation

1. Install the Fluent wallet and switch to the Conflux Testnet network.
2. Acquire some test tokens from the [Conflux Testnet Faucet](https://faucet.confluxnetwork.org).
3. Have a contract address ready, for example: `cfxtest:acgwyxdwpc8475n2na9uk9rfbghstg1xtumht10mue`.

### Query Sponsor Info

In the **Read Contract** tab, all the contract's view methods are listed. Open any of them, input the parameter (if any), and click the **Query** button to obtain the result.

For instance, using `getSponsorForGas`:

If a **Zero Address** is returned, it signifies that the contract is not sponsored.

### Sponsor Storage

In the **Write Contract** tab, all the contract's write methods are listed. Before using it, connect your wallet.

If a write method includes a `payable` modifier, the first input box can be used to set the amount of CFX to be transferred to the contract when calling the method.

For example, inputting `50` means transferring 50 CFX to the contract.

Then click the **Write** button. A popup will appear; click **Confirm** to approve the transaction.

After transaction execution, you can query the contract's sponsor info again.

**Note:** Half of the CFX will be converted into storage points.

### Sponsor Gas

Set 10 CFX for the gas sponsor balance, with an upper bound of `1000000000000000` Drip (10^15 Drip).

After the transaction execution, you can query the contract's sponsor info again.

### Whitelist

Finally, add the zero address to the whitelist to use the contract without paying a gas fee.

For the second parameter, which is an array, pass `["0x0000000000000000000000000000000000000000"]`.

### Check Contract Storage Usage Info on ConfluxScan

You can check the contract's storage usage and sponsor balance info on the [ConfluxScan](https://confluxscan.io) contract detail page.
