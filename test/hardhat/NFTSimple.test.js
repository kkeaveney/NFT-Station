const fs = require('fs');
const { expect } = require('chai')


describe('Price consumer', async function () {

let nftSimple, linkToken, vrfCoordinatorMock, accounts, deployer
const keyhash = '0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311';

describe('deployments', async () => {

  it('deploy contracts and set variables', async () => {
      const MockLink = await ethers.getContractFactory("MockLink")
      const NFTSimple = await ethers.getContractFactory("NFTSimple");
      const VRFCoordinatorMock = await ethers.getContractFactory("VRFCoordinatorMock")
      // fee = '1000000000000000000'
      seed = 123
      link = await MockLink.deploy()
      vrfCoordinatorMock = await VRFCoordinatorMock.deploy(link.address)
      nftSimple = await NFTSimple.deploy(vrfCoordinatorMock.address, link.address, keyhash)
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

  it('should mint NFT', async () => {
    nftSimple.mint(deployer.address, 0) // tokenId = 0
    let nftNum = (await nftSimple.balanceOf(deployer.address)).toNumber()
    expect(nftNum).to.equal(1)
  })

  it('should batch mint from 10 to 19, check balances', async () => {
    await nftSimple.batchMint(deployer.address, 10)
    let nftNum = (await nftSimple.balanceOf(deployer.address)).toNumber()
    expect(nftNum).to.equal(11)
    nftNum = (await nftSimple.balanceOf(receiver.address)).toNumber()
    expect(nftNum).to.equal(0)
  })

  it('should test the result of the random number request', async () => {
    tx = await nftSimple._safeTransferFrom(deployer.address, receiver.address, 0, 123) // tokenId = 0
    receipt = await tx.wait()
    let requestId = receipt.events[1].topics[0]
    expect(await nftSimple.ownerOf(0)).to.equal(receiver.address)
    requestId = '0xcf26e3987ecc97c98a2bab30fc819312ced3c2aa354ea9dcbf6a63631e256be2'
    await vrfCoordinatorMock.callBackWithRandomness(requestId, 123, nftSimple.address)
    expect(await nftSimple.randomResult()).to.equal(123)
  })

  })
})
