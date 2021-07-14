const fs = require('fs');
const { expect } = require('chai');
var sleep = require('sleep');
const { ethers, waffle } = require('ethers');


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

let nftSimple, linkToken, deployer, tokenURI, tokenId, nftTotalSupply

describe('deployments', async () => {

// Get signer information
  const accounts = await hre.ethers.getSigners()
  const [deployer, receiver ] = accounts
  const amount = '2000000000000000000';// if this is a string it will overflow
  let tokenURI = "www.www.com"

  it('deploy contracts', async () => {

    linkToken = new ethers.Contract(Linkaddress, LinkToken.abi, deployer)
    nftSimple = new ethers.Contract(NFTSimple.address, NFTSimple.abi, deployer)
  })

  it('should send link to the deployed contract', async () => {
    let tx = await linkToken.transfer(nftSimple.address, amount)
    let result = tx.wait()
    let balance = await linkToken.balanceOf(nftSimple.address)
    expect(balance).to.not.equal(0)
    console.log("Amount of LINK tokens in the contract:", ethers.utils.formatEther(balance));
  })

  it('should create a collectible batch', async () => {
    let seed = 111
    seed=seed++ // For userseed
    let requestId

    let tx = await nftSimple.createCollectibles(0, tokenURI, seed, { from : deployer.address})
    let request  = await tx.wait().then((transaction) => {
      console.log(transaction)
    })

    // update total NFT supply
    nftTotalSupply = await nftSimple.totalSupply()
    nftTotalSupply = nftTotalSupply++;

    let eventFilter = nftSimple.filters.RequestCollectible()
    let events = await nftSimple.queryFilter(eventFilter)

    // confirm tokenIds and random numbers
    for(let i = 0; i <= nftTotalSupply - 1; i++){

      tokenId = await nftSimple.tokenByIndex(i)
      let sender = await nftSimple.getTransactionFromIndex(i)
      tokenURI = await nftSimple.tokenURI(tokenId)

      expect(sender[0]).to.equal(tokenId)
      expect(sender[1]).to.be.lessThan(3) // Breed, randNum % 3
      expect(sender[2]).to.equal(tokenURI)
      expect(sender[3]).to.equal(deployer.address) // Breed, randNum % 3
    }
      //confirm NFT contract is up to date
      nftNum = (await nftSimple.balanceOf(deployer.address)).toNumber()
      expect(nftNum).to.equal(nftTotalSupply)
  })

  it('should create a collectible batch from another account', async () => {
    let seed = 111
    seed=seed++ // For userseed
    let requestId

    let tx = await nftSimple.connect(receiver).createCollectibles(0, tokenURI, seed)
    let request  = await tx.wait().then((transaction) => {
    })
    //await token.connect(signers[1]).mint(signers[0].address, 1001);
    // update total NFT supply
    nftTotalSupply = await nftSimple.totalSupply()
    nftTotalSupply = nftTotalSupply++;

    let eventFilter = nftSimple.filters.RequestCollectible()
    let events = await nftSimple.queryFilter(eventFilter)

    // confirm tokenIds and random numbers
    for(let i = 0; i <= nftTotalSupply - 1; i++){

      tokenId = await nftSimple.tokenByIndex(i)
      let sender = await nftSimple.getTransactionFromIndex(i)
      tokenURI = await nftSimple.tokenURI(tokenId)

      expect(sender[0]).to.equal(tokenId)
      expect(sender[1]).to.be.lessThan(3) // Breed, randNum % 3
      expect(sender[2]).to.equal(tokenURI)
      expect(sender[3]).to.equal(deployer.address) // Breed, randNum % 3
    }
      //confirm NFT contract is up to date
      nftNum = (await nftSimple.balanceOf(deployer.address)).toNumber()
      expect(nftNum).to.equal(nftTotalSupply)
  })
})

