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
const Link_Token_abi='[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_data","type":"bytes"}],"name":"transferAndCall","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"data","type":"bytes"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"}]'

let nftSimple, randomNumberConsumer, linkTokenContract

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

    nftSimple = new ethers.Contract(NFTSimple_adr.address, NFTSimple_Contract.abi, deployer)
    randomNumberConsumer = new ethers.Contract(RandomNumberConsumer_adr.address, RandomNumberConsumer_Contract.abi, deployer)
    linkTokenContract = new ethers.Contract(linkTokenAddress, Link_Token_abi, deployer)

    console.log("Deployer", deployer.address)
    console.log("LINK", linkTokenContract.address)
    console.log("NFT Simple", nftSimple.address)
    console.log('Random Number Consumer', randomNumberConsumer.address)

    saveFrontendFiles()

    //wait for 30 seconds before verify
    await sleep.sleep(30)

    // verify contracts
    //npx hardhat clean will clear `ENOENT: no such file or directory` error

    await hre.run("verify:verify", {
        address: nftSimple.address,
        constructorArguments: [vrfCoordinatorAddress, linkTokenAddress, keyHash, fee],
    })

    // Fund with LINK
    const amount = web3.utils.toHex(1e18)
    let tx = await linkTokenContract.transfer(nftSimple.address, amount)
    let receipt = await tx.wait()

    // Mint NFTs
    // tx = await nftSimple.batchMint(deployer.address, 1, 'www.win.com', 123)
    // receipt = await tx.wait()
    // let totalSupply = await nftSimple.totalSupply()
    // console.log('NFT total supply', totalSupply.toString())

    // // // Get owner of 1st NFT
    // let tokenId = await nftSimple.tokenOfOwnerByIndex(deployer.address, 0)
    // let owner = await nftSimple.ownerOf(tokenId)
    // console.log('tokenId owner', owner)

    // // // transfer NFT to reciever
    // tx = await nftSimple._safeTransferFrom(deployer.address, receiver.address, tokenId, tokenId)
    // recipt = await tx.wait()
    // tokenId = await nftSimple.tokenOfOwnerByIndex(receiver.address, 0)
    // let newOwner = await nftSimple.ownerOf(tokenId)
    // console.log('tokenId owner after transfer', newOwner)
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
