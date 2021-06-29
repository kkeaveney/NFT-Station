const fs = require('fs');
let { networkConfig } = require('../helper-hardhat-config')
require("@nomiclabs/hardhat-web3") // web3
require("@nomiclabs/hardhat-ethers")
require('dotenv').config()
const hre = require("hardhat");
var sleep = require('sleep');

/**
 * Network: Rinkeby
 * Chainlink VRF Coordinator address: 0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B
 * LINK token address:                0x01be23585060835e02b77ef475b0cc51aa1e0709
 * Key Hash: 0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311
 */

const vrfCoordinatorAddress='0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B'
const linkTokenAddress='0x01be23585060835e02b77ef475b0cc51aa1e0709'
const NFTSimple_adr=JSON.parse(fs.readFileSync('deployments/rinkeby/NFTSimple.json', 'utf8'));
const NFTSimple_Contract=JSON.parse(fs.readFileSync('artifacts/contracts/NFTSimple.sol/NFTSimple.json', 'utf8'));
const RandomNumberConsumer_adr=JSON.parse(fs.readFileSync('deployments/rinkeby/RandomNumberConsumer.json', 'utf8'));
const RandomNumberConsumer_Contract=JSON.parse(fs.readFileSync('artifacts/contracts/RandomNumberConsumer.sol/RandomNumberConsumer.json', 'utf8'));
const APIConsumer_adr=JSON.parse(fs.readFileSync('deployments/rinkeby/APIConsumer.json', 'utf8'));
const APIConsumer_Contract=JSON.parse(fs.readFileSync('artifacts/contracts/APIConsumer.sol/APIConsumer.json', 'utf8'));
const PriceConsumer_adr=JSON.parse(fs.readFileSync('deployments/rinkeby/PriceConsumerV3.json', 'utf8'));
const PriceConsumer_Contract=JSON.parse(fs.readFileSync('artifacts/contracts/PriceConsumerV3.sol/PriceConsumerV3.json', 'utf8'));

let nftSimple, randomNumberConsumer, apiConsumer, priceConsumer

async function main() {

   // ethers is avaialble in the global scope
  const [deployer, receiver] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );


    const chainId = await getChainId()
    const keyHash = networkConfig[chainId]['keyHash']
    const fee = networkConfig[chainId]['fee']

    randomNumberConsumer = new ethers.Contract(RandomNumberConsumer_adr.address, RandomNumberConsumer_Contract.abi, deployer)
    apiConsumer = new ethers.Contract(APIConsumer_adr.address, APIConsumer_Contract.abi, deployer)
    priceConsumer = new ethers.Contract(PriceConsumer_adr.address, PriceConsumer_Contract.abi, deployer)
    nftSimple = new ethers.Contract(NFTSimple_adr.address, NFTSimple_Contract.abi, deployer)

    console.log("API Consumer", apiConsumer.address)
    console.log("Price Consumer", priceConsumer.address)
    console.log("NFT Simple", nftSimple.address)
    console.log('Random Number Consumer', randomNumberConsumer.address)
    console.log('VRF', vrfCoordinatorAddress)


    saveFrontendFiles()

    //wait for 30 seconds before verify
    await sleep.sleep(30)

    // verify contracts
    //npx hardhat clean will clear `ENOENT: no such file or directory` error

    await hre.run("verify:verify", {
        address: nftSimple.address,
        constructorArguments: [vrfCoordinatorAddress, linkTokenAddress, keyHash, fee],
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
        APIConsumer: apiConsumer.address,
        PriceConsumerV3: priceConsumer.address,
        RandomNumberConsumer: randomNumberConsumer.address,
        VRFCoordinatorMock: vrfCoordinatorAddress
        }, undefined, 2)
    );

    const MockLinkArt = artifacts.readArtifactSync("MockLink");
    const NFTSimpleArt = artifacts.readArtifactSync("NFTSimple");
    const APIConsumer = artifacts.readArtifactSync("APIConsumer");
    const PriceConsumer = artifacts.readArtifactSync("PriceConsumerV3")
    const RandomNumberConsumerArt = artifacts.readArtifactSync("RandomNumberConsumer");
    const VRFCoordinatorMockArt = artifacts.readArtifactSync("VRFCoordinatorMock");

    fs.writeFileSync(contractsDir + "/MockLink.json",JSON.stringify(MockLinkArt, null, 2));
    fs.writeFileSync(contractsDir + "/NFTSimple.json",JSON.stringify(NFTSimpleArt, null, 2));
    fs.writeFileSync(contractsDir + "/APIConsumer.json",JSON.stringify(APIConsumer, null, 2));
    fs.writeFileSync(contractsDir + "/PriceConsumer .json",JSON.stringify(PriceConsumer, null, 2));
    fs.writeFileSync(contractsDir + "/RandomNumberConsumer.json",JSON.stringify(RandomNumberConsumerArt, null, 2));
    fs.writeFileSync(contractsDir + "/VRFCoordinatorMock.json",JSON.stringify(VRFCoordinatorMockArt, null, 2));

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
