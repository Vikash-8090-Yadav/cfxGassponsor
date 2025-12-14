const { Conflux } = require('js-conflux-sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  console.log('Deploying GasSponsoredVoting contract to Conflux...');

  const conflux = new Conflux({
    url: process.env.NEXT_PUBLIC_CONFLUX_RPC_URL || 'https://test.confluxrpc.com',
    networkId: parseInt(process.env.NEXT_PUBLIC_NETWORK_ID || '1'),
  });

  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not found in .env file');
  }

  const account = conflux.wallet.addPrivateKey(process.env.PRIVATE_KEY);
  console.log('Deploying from account:', account.address);

  const artifactPath = path.join(__dirname, '../artifacts/contracts/Voting.sol/GasSponsoredVoting.json');
  
  if (!fs.existsSync(artifactPath)) {
    throw new Error('Contract artifact not found. Please run "npm run compile" first.');
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const bytecode = artifact.bytecode;
  const abi = artifact.abi;

  const contract = conflux.Contract({ abi, bytecode });

  console.log('Deploying contract...');
  const receipt = await contract.constructor().sendTransaction({
    from: account.address,
  }).executed();

  const contractAddress = receipt.contractCreated;
  console.log('\n✅ GasSponsoredVoting deployed successfully!');
  console.log('Contract Address:', contractAddress);
  console.log('Transaction Hash:', receipt.transactionHash);
  console.log('\n📝 Add this to your .env file:');
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:');
    console.error(error);
    process.exit(1);
  });

