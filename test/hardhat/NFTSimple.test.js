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

      console.log("Link",link.address);
      console.log("NFTSimple", nftSimple.address);
      console.log("VRF", vrfCoordinatorMock.address);
  })

  it('should send link to the deployed contract', async () => {
      let amount = '2000000000000000000' // if this is a string it will overflow
      await link.transfer(nftSimple.address, amount)
      let balance = await link.balanceOf(nftSimple.address)
      expect(balance).to.equal(amount)
      console.log("Amount of LINK tokens in the contract:", ethers.utils.formatEther(balance));
  })

   it('should batch mint from 0 to 9, check balances', async () => {
    await nftSimple.batchMint(deployer.address, tokenURI, 10, 123)
    let nftNum = (await nftSimple.balanceOf(deployer.address)).toNumber()
    expect(nftNum).to.equal(10)
    nftNum = (await nftSimple.balanceOf(receiver.address)).toNumber()
    expect(nftNum).to.equal(0)
    // confirm tokenId owner
    let tokenId = await nftSimple.tokenByIndex(0)
    expect (await nftSimple.tokenOfOwnerByIndex(deployer.address, 0)).to.equal(tokenId)
  })

  it('should create a collectible', async () => {
    let tokenId = await nftSimple.tokenCounter()
    let tokenURI = 'www.world.com'
    let randNum = 5 // % 3 should return a Breed of 2, SHIBA_INU
    let requestId
    let tx = await nftSimple.batchMint(deployer.address, tokenURI, 1, 123)
    let request  = await tx.wait().then((transaction) => {
      requestId = transaction.events[3].args.requestId
    })

    // Test the result of the random number request
    await vrfCoordinatorMock.callBackWithRandomness(requestId, randNum, nftSimple.address)

    let sender = await nftSimple.requestIdTransaction(requestId)
       expect(sender[0]).to.equal(deployer.address)
       expect(sender[1]).to.equal(tokenURI)
       expect(sender[2]).to.equal(tokenId)
       expect(sender[3]).to.equal(2) // randNum % 3

    // confirm NFT contract is up to date
    nftNum = (await nftSimple.balanceOf(deployer.address)).toNumber()
    expect(nftNum).to.equal(11)
    id = await nftSimple.tokenByIndex(10)

  })
})
