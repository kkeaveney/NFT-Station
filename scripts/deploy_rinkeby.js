const fs = require('fs');
require("@nomiclabs/hardhat-web3") // web3
require('dotenv').config()
const hre = require("hardhat");
var sleep = require('sleep');

/**
 * Constructor inherits VRFConsumerBase
 * 
 * Network: Rinkeby
 * Chainlink VRF Coordinator address: 0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B
 * LINK token address:                0x01be23585060835e02b77ef475b0cc51aa1e0709
 * Key Hash: 0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311
 */

const VRF_Coordinator_Addr='0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B'
const LINK_adr='0x01be23585060835e02b77ef475b0cc51aa1e0709'
const keyhash='0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311'
const NFTSimple_adr=JSON.parse(fs.readFileSync('deployments/rinkeby/NFTSimple.json', 'utf8'));
const NFTSimple_Contract=JSON.parse(fs.readFileSync('artifacts/contracts/NFTSimple.sol/NFTSimple.json', 'utf8'));

let accounts

async function main() {

    // ethers is avaialble in the global scope
  const [deployer, receiver] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );
    console.log("Account balance:", (await deployer.getBalance()).toString());
    const nftSimple = new ethers.Contract(NFTSimple_adr.address, NFTSimple_Contract.abi, deployer)
    
    console.log("Deployer", deployer.address)
    console.log("N.F.T", nftSimple.address)
    console.log('VRF', VRF_Coordinator_Addr)

    saveFrontendFiles()

    // wait for 30 seconds before verify
    await sleep.sleep(30)

    // verify contracts
    // npx hardhat clean will clear `ENOENT: no such file or directory` error

    await hre.run("verify:verify", {
        address: nftSimple.address,
        constructorArguments: [],
    })

    
    // Mint NFTs
    await nftSimple.batchMint(deployer.address, 2)
    let totalSupply = await nftSimple.totalSupply()
    console.log('NFT total supply', totalSupply.toString())

    // Get owner of 1st NFT
    let tokenId = await nftSimple.tokenOfOwnerByIndex(deployer.address, 0)
    let owner = await nftSimple.ownerOf(tokenId)
    console.log('tokenId owner', owner)

    // transfer NFT to reciever
    await nftSimple._safeTransferFrom(deployer.address, receiver.address, tokenId, tokenId)
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
        MockLink: LINK_adr,
        NFTSimple: NFTSimple_adr.address,
        VRFCoordinatorMock: VRF_Coordinator_Addr
        }, undefined, 2)
    );
    const MockLinkArt = artifacts.readArtifactSync("MockLink");
    const NFTSimpleArt = artifacts.readArtifactSync("NFTSimple");
    const VRFCoordinatorMockArt = artifacts.readArtifactSync("VRFCoordinatorMock");
    
    fs.writeFileSync(contractsDir + "/MockLink.json",JSON.stringify(MockLinkArt, null, 2));
    fs.writeFileSync(contractsDir + "/NFTSimple.json",JSON.stringify(NFTSimpleArt, null, 2));
    fs.writeFileSync(contractsDir + "/VRFCoordinatorMock.json",JSON.stringify(VRFCoordinatorMockArt, null, 2));
    
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
