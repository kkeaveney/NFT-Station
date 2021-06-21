const fs = require('fs');
let { networkConfig } = require('../helper-hardhat-config')
require("@nomiclabs/hardhat-web3") // web3
require("@nomiclabs/hardhat-ethers")
require('dotenv').config()
const hre = require("hardhat");
var sleep = require('sleep');

/**
 * Network: Kovan
 * Chainlink VRF Coordinator address: 0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9
 * LINK token address:                0xa36085F69e2889c224210F603D836748e7dC0088
 * Key Hash: 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4
 */

const vrfCoordinatorAddress='0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9'
const linkTokenAddres='0xa36085F69e2889c224210F603D836748e7dC0088'
const NFTSimple_adr=JSON.parse(fs.readFileSync('deployments/rinkeby/NFTSimple.json', 'utf8'));
const NFTSimple_Contract=JSON.parse(fs.readFileSync('artifacts/contracts/NFTSimple.sol/NFTSimple.json', 'utf8'));
const RandomNumberConsumer_adr=JSON.parse(fs.readFileSync('deployments/rinkeby/RandomNumberConsumer.json', 'utf8'));
const RandomNumberConsumer_Contract=JSON.parse(fs.readFileSync('artifacts/contracts/RandomNumberConsumer.sol/RandomNumberConsumer.json', 'utf8'));

let nftSimple, randomNumberConsumer

async function main() {

   // ethers is avaialble in the global scope
  const [deployer, receiver] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );
    console.log("Account balance:", (await deployer.getBalance()).toString());
    

    nftSimple = new ethers.Contract(NFTSimple_adr.address, NFTSimple_Contract.abi, deployer)

    const chainId = await getChainId()
    const keyHash = networkConfig[chainId]['keyHash']
    const fee = networkConfig[chainId]['fee']

    randomNumberConsumer = new ethers.Contract(RandomNumberConsumer_adr.address, RandomNumberConsumer_Contract.abi, deployer)
  

    console.log("Deployer", deployer.address)
    console.log("N.F.T", nftSimple.address)
    console.log('Random Number', randomNumberConsumer.address)
    console.log('VRF', vrfCoordinatorAddress)
    

    saveFrontendFiles()

    // wait for 30 seconds before verify
    await sleep.sleep(30)

    // verify contracts
    // npx hardhat clean will clear `ENOENT: no such file or directory` error

    await hre.run("verify:verify", {
        address: nftSimple.address,
        constructorArguments: [],
    })

    await hre.run("verify:verify" , {
        address: randomNumberConsumer.address,
        constructorArguments: [vrfCoordinatorAddress, linkTokenAddress, keyHash, fee]
    })


    // Mint NFTs
    let tx = await nftSimple.batchMint(deployer.address, 6)
    let receipt = await tx.wait()
    
    let totalSupply = await nftSimple.totalSupply()
    console.log('NFT total supply', totalSupply.toString())

    // Get owner of 1st NFT
    let tokenId = await nftSimple.tokenOfOwnerByIndex(deployer.address, 0)
    let owner = await nftSimple.ownerOf(tokenId)
    console.log('tokenId owner', owner)

    // transfer NFT to reciever
    tx = await nftSimple._safeTransferFrom(deployer.address, receiver.address, tokenId, tokenId)
    recipt = await tx.wait()
    
    tokenId = await nftSimple.tokenOfOwnerByIndex(receiver.address, 0)
    let newOwner = await nftSimple.ownerOf(tokenId)
    console.log('tokenId owner after transfer', newOwner)
}

function saveFrontendFiles() {
    const contractsDir = __dirname + "/../frontend/src/contracts";
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir);
    }
  
    fs.writeFileSync(
      contractsDir + "/contract-address.json",
      JSON.stringify({
        MockLink: linkTokenAddress,
        NFTSimple: nftSimple.address,
        RandomNumberConsumer: randomNumberConsumer.address, 
        VRFCoordinatorMock: vrfCoordinatorAddress
        }, undefined, 2)
    );
    
    const MockLinkArt = artifacts.readArtifactSync("MockLink");
    const NFTSimpleArt = artifacts.readArtifactSync("NFTSimple");
    const RandomNumberConsumerArt = artifacts.readArtifactSync("RandomNumberConsumer");
    const VRFCoordinatorMockArt = artifacts.readArtifactSync("VRFCoordinatorMock");
    
    fs.writeFileSync(contractsDir + "/MockLink.json",JSON.stringify(MockLinkArt, null, 2));
    fs.writeFileSync(contractsDir + "/NFTSimple.json",JSON.stringify(NFTSimpleArt, null, 2));
    fs.writeFileSync(contractsDir + "/RandomNumberConsumer.json",JSON.stringify(RandomNumberConsumerArt, null, 2));
    fs.writeFileSync(contractsDir + "/VRFCoordinatorMock.json",JSON.stringify(VRFCoordinatorMockArt, null, 2));
    
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


