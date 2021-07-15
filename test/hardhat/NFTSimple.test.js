const fs = require('fs');
const { networkConfig } = require('../../helper-hardhat-config');
require("@nomiclabs/hardhat-web3") // web3
require("@nomiclabs/hardhat-ethers")
require('dotenv').config()
const hre = require("hardhat");
const { expect } = require('chai');


let nftSimple, vrfCoordinatorMock, accounts, deployer, tokenURI

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

  it('should create collectibles', async () => {
    let tokenId
    let tokenURI = 'www.world.com'
    let randNum = 5 // % 3 should return a Breed of 2, SHIBA_INU
    let requestId
    let tx = await nftSimple.createCollectibles(tokenURI, 123)
    let request  = await tx.wait().then((transaction) => {
      requestId = transaction.events[3].args.requestId
    })

     // Test the result of the random number request
    await vrfCoordinatorMock.callBackWithRandomness(requestId, randNum, nftSimple.address)
    tokenId = await nftSimple.requestIdToTokenId(requestId)
    // last emitted event
    let sender = await nftSimple.requestIdTransaction(requestId)
       expect(sender[0]).to.equal(deployer.address)
       expect(sender[1]).to.equal(tokenURI)
       expect(sender[2]).to.equal(tokenId)
       expect(sender[3]).to.equal(2) // randNum % 3
       //confirm NFT contract is up to date
      nftNum = (await nftSimple.balanceOf(deployer.address)).toNumber()
      expect(nftNum).to.equal(1)
      expect(await nftSimple.totalSupply()).to.equal(1)

      // mint collectible to another address
      tx = await nftSimple.connect(receiver).createCollectibles(tokenURI, 124)
      request  = await tx.wait().then((transaction) => {
      requestId = transaction.events[3].args.requestId
    })
      // Test the result of the random number request
     await vrfCoordinatorMock.callBackWithRandomness(requestId, randNum, nftSimple.address)
     tokenId = await nftSimple.requestIdToTokenId(requestId)
     let owner = await nftSimple.ownerOf(tokenId)

     sender = await nftSimple.requestIdTransaction(requestId)
       expect(sender[0]).to.equal(owner)
       expect(sender[1]).to.equal(tokenURI)
       expect(sender[2]).to.equal(tokenId)
       expect(sender[3]).to.equal(2) // randNum % 3
       //confirm NFT contract is up to date
      nftNum = (await nftSimple.balanceOf(receiver.address)).toNumber()
      expect(nftNum).to.equal(1)
      expect(await nftSimple.totalSupply()).to.equal(2)
  })
})
