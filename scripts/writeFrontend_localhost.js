// local deployment using hardhat 
// run `npx hardhat node` to startup local instance
const fs = require('fs');
require("@nomiclabs/hardhat-web3")
require('dotenv').config()

let vrfCoordinatorMock, nftSimple, seed, link, keyhash, accounts

async function main() {
    // convenience check
    if(network.name == "hardhat") {
        console.warn(
        "You are trying to deploy a contract to the Hardhat Network, which " +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
        )
    }

    // ethers is available in the global scope
    const [deployer] = await ethers.getSigners()
    console.log(
        "Deploying the contracts with the account:",
        await deployer.getAddress()
    )    

    console.log("Account balance:", (await deployer.getBalance()).toString())

    const MockLink = await ethers.getContractFactory("LinkToken")
    const NFTSimple = await ethers.getContractFactory("NFTSimple");
    const VRFCoordinatorMock = await ethers.getContractFactory("VRFCoordinatorMock")
    keyhash = '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4'
    // fee = '1000000000000000000'
    seed = 123
    link = await MockLink.deploy()
    vrfCoordinatorMock = await VRFCoordinatorMock.deploy(link.address)
    nftSimple = await NFTSimple.deploy();
    
    console.log("Deployer", deployer.address)
    console.log("Link", link.address)
    console.log("nftSimple", nftSimple.address)
    console.log("VRF", vrfCoordinatorMock.address)

    // We also save the contract's artifacts and address in the frontend directory
    saveFrontendFiles();

    // send link to the deployed contract
    let amount = '1000000000000000'
    await link.transfer(nftSimple.address, amount)
    let balance = await link.balanceOf(nftSimple.address)
    console.log('NFT contract Link balance', balance.toNumber())

    //mint NFT
    let tx = await nftSimple.batchMint(deployer.address, 3) // tokenID = 0 to 9
    let receipt = await tx.wait()
    
    let totalSupply = await nftSimple.totalSupply()
    console.log('Total NFT supply',totalSupply.toNumber())
    // Get TokenId and confirm ownership
    let tokenId = await nftSimple.tokenByIndex(0)
    let owner = await nftSimple.ownerOf(tokenId)
    console.log('NFT owner',owner)
}

function saveFrontendFiles() {
    const contractsDir = __dirname + "/../frontend/src/contracts";
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir);
    }
  
    fs.writeFileSync(
      contractsDir + "/contract-address.json",
      JSON.stringify({ 
        MockLink: link.address,
        NFTSimple: nftSimple.address,
        VRFCoordinatorMock: vrfCoordinatorMock.address
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
        console.error(error)
        process.exit(1)
    })