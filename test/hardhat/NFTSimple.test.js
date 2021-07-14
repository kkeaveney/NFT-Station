const fs = require('fs');
const { networkConfig } = require('../../helper-hardhat-config');
require("@nomiclabs/hardhat-web3") // web3
require("@nomiclabs/hardhat-ethers")
require('dotenv').config()
const hre = require("hardhat");
const { expect } = require('chai');


let nftSimple, vrfCoordinatorMock, accounts, deployer, tokenURI, nftTotalSupply, tokenId, requestId

describe('deployments', async () => {

  it('deploy contracts', async () => {
      const chainId = await getChainId()
      const keyhash = networkConfig[chainId]['keyHash']
      const fee = networkConfig[chainId]['fee']
      const MockLink = await ethers.getContractFactory("MockLink")
      const NFTSimple = await ethers.getContractFactory("NFTSimple");
      const VRFCoordinatorMock = await ethers.getContractFactory("VRFCoordinatorMock")
      tokenURI = 'www.world.com'
      // fee = '1000000000000000000'
      seed = 123
      link = await MockLink.deploy()
      vrfCoordinatorMock = await VRFCoordinatorMock.deploy(link.address)
      nftSimple = await NFTSimple.deploy(vrfCoordinatorMock.address, link.address, keyhash, fee)
      accounts = await hre.ethers.getSigners();
      deployer = accounts[0];
      receiver = accounts[1];
  })

  it('should send link to the deployed contract', async () => {
      let amount = '2000000000000000000' // if this is a string it will overflow
      await link.transfer(nftSimple.address, amount)
      let balance = await link.balanceOf(nftSimple.address)
      expect(balance).to.equal(amount)
      console.log("Amount of LINK tokens in the contract:", ethers.utils.formatEther(balance));
  })

  it('should create collectibles, with unique tokenIds', async () => {
    let nfts = 5
    let = 123
    let randNum = 5 // % 3 should return a Breed of 2, SHIBA_INU
    let tx = await nftSimple.createCollectibles(nfts, tokenURI, seed)
    let request  = await tx.wait().then((transaction) => {
      requestId = transaction.events[3].args.requestId
    })
    // Test the result of the random number request
    await vrfCoordinatorMock.callBackWithRandomness(requestId, randNum, nftSimple.address)

    // update total NFT supply
    nftTotalSupply = await nftSimple.totalSupply()
    nftTotalSupply = nftTotalSupply++;

    // confirm tokenIds and random numbers
    for(let i = 0; i <= nftTotalSupply - 1; i++){
      tokenId = await nftSimple.tokenByIndex(i)
      let sender = await nftSimple.getTransactionFromIndex(i)

      expect(sender[0]).to.equal(tokenId)
      expect(sender[1]).to.equal(2) // Breed, randNum % 3
      expect(sender[2]).to.equal(tokenURI) // Breed, randNum % 3
      expect(sender[3]).to.equal(deployer.address) // Breed, randNum % 3
    }
      //confirm NFT contract is up to date
      nftNum = (await nftSimple.balanceOf(deployer.address)).toNumber()
      expect(nftNum).to.equal(nftTotalSupply)
  })
})
