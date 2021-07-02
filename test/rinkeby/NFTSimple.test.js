const fs = require('fs');
const { expect } = require('chai');
var sleep = require('sleep');
const ethers = require('ethers');


/**
 * Constructor inherits VRFConsumerBase
 *
 * Network: Rinkeby
 * Chainlink VRF Coordinator address: 0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B
 * LINK token address:                0x01be23585060835e02b77ef475b0cc51aa1e0709
 * Key Hash: 0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311
 */

const NFTSimple=JSON.parse(fs.readFileSync('deployments/rinkeby/NFTSimple.json', 'utf8'));
const LinkToken=JSON.parse(fs.readFileSync('deployments/rinkeby/LinkToken.json', 'utf8'));
const Linkaddress = '0x01be23585060835e02b77ef475b0cc51aa1e0709'

let nftSimple, linkToken, deployer, tokenURI

describe('deployments', async () => {

// Get signer information
  const accounts = await hre.ethers.getSigners()
  const [deployer, receiver ] = accounts
  const amount = '2000000000000000000';// if this is a string it will overflow
  const tokenURI = "www.world.com"

  it('deploy contracts', async () => {

    linkToken = new ethers.Contract(Linkaddress, LinkToken.abi, deployer)
    nftSimple = new ethers.Contract(NFTSimple.address, NFTSimple.abi, deployer)

    console.log("Link",linkToken.address);
    console.log("NFTSimple", nftSimple.address);
    })

  it('should send link to the deployed contract', async () => {
    let tx = await linkToken.transfer(nftSimple.address, amount)
    let result = tx.wait()
    let balance = await linkToken.balanceOf(nftSimple.address)
    expect(balance).to.not.equal(0)
    console.log("Amount of LINK tokens in the contract:", ethers.utils.formatEther(balance));
  })

   it('should batch mint, check balances', async () => {
    let userSeed = await nftSimple.totalSupply()
    userSeed++
    await nftSimple.batchMint(deployer.address, 10, tokenURI, 766555)
    let nftNum = (await nftSimple.balanceOf(deployer.address)).toNumber()
    expect(nftNum).to.not.equal(0)
    nftNum = (await nftSimple.balanceOf(receiver.address)).toNumber()
    expect(nftNum).to.equal(0)
    // // confirm tokenId owner
    let tokenId = await nftSimple.tokenByIndex(0)
    expect (await nftSimple.tokenOfOwnerByIndex(deployer.address, 0)).to.equal(tokenId)
  })

  it('should create a collectible', async () => {
    tokenId = await nftSimple.tokenCounter()
    let requestId

    let tx = await nftSimple.batchMint(deployer.address, 1, tokenURI, 123)
    let request  = await tx.wait().then((transaction) => {
    })

    let eventFilter = nftSimple.filters.RequestCollectible()
    let events = await nftSimple.queryFilter(eventFilter)
    let event = events[events.length - 1]
    requestId = event.args.requestId

    // Test the result of the random number request
    let sender = await nftSimple.requestIdTransaction(requestId)
       expect(sender[0]).to.equal(deployer.address)
       expect(sender[1]).to.equal(tokenURI)
       expect(sender[2]).to.equal(tokenId)
       expect(sender[3]).to.be.lessThan(3) // Returned randomness
       console.log(sender)

    // // confirm NFT contract is up to date
    //nftNum = (await nftSimple.balanceOf(deployer.address)).toNumber()
    //console.log('Deployer owns', nftNum.toString())
    //id = await nftSimple.tokenByIndex(10)
  })
})