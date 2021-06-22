const fs = require('fs');
const { expect } = require('chai')
const { parseEther, parseUnits } = require("ethers/lib/utils");


describe('Price consumer', async function () {

let deployer, receiver, nftSimple, link, vrfCoordinatorMock

    it('deploys and sets variables', async () => {
      //beforeEach(async () => {
      [deployer, receiver] = await ethers.getSigners()
      const MockLink = await ethers.getContractFactory("MockLink")
      const NFTSimple = await ethers.getContractFactory("NFTSimple")
      const VRFCoordinatorMock = await ethers.getContractFactory("VRFCoordinatorMock")
      link = await MockLink.deploy()
      nftSimple = await NFTSimple.deploy()
      vrfCoordinatorMock = await VRFCoordinatorMock.deploy(link.address)
    })

  it('should send link to the deployed contract', async () => {
    let amount = '2000000000000000000' // if this is a string it will overflow
    await link.transfer(nftSimple.address, amount)
   
    let balance = await link.balanceOf(nftSimple.address)
    expect(balance).to.equal(amount)
    console.log("Amount of LINK tokens in the contract:", ethers.utils.formatEther(balance));
  })

  it('should mint NFT', async () => {
    nftSimple.mint(deployer.address, 0) // tokenId = 0
    nftSimple.mint(deployer.address, 1) // tokenId = 1
    nftSimple.mint(deployer.address, 2) // tokenId = 2
    nftSimple.mint(deployer.address, 3) // tokenId = 3

    let nftNum = (await nftSimple.balanceOf(deployer.address)).toNumber()
    expect(nftNum).to.equal(4)
  })

  it('should batch mint from 10 to 19, check balances', async () => {
    await nftSimple.batchMint(deployer.address, 10)
    let nftNum = (await nftSimple.balanceOf(deployer.address)).toNumber()
    expect(nftNum).to.equal(14)
    nftNum = (await nftSimple.balanceOf(receiver.address)).toNumber()
    expect(nftNum).to.equal(0)
  })

  it('should transfer NFT to new owner', async () => {
    tx = await nftSimple._safeTransferFrom(deployer.address, receiver.address, 0, 123)
    receipt = await tx.wait()
    expect(await nftSimple.ownerOf(0)).to.equal(receiver.address)
  })

  it('should test the result of the random number request', async () => {

  })

})
