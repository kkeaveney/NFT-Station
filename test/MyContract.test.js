const fs = require('fs');
const { expect } = require('chai')
const { parseEther, parseUnits } = require("ethers/lib/utils");



describe('Price consumer', async function () {
  
  const linkTokenAddress='0x01be23585060835e02b77ef475b0cc51aa1e0709'
  const link_Token=JSON.parse(fs.readFileSync('artifacts/@chainlink/token/contracts/v0.6/LinkToken.sol/LinkToken.json', 'utf8'));
  const priceConsumer_Contract=JSON.parse(fs.readFileSync('deployments/rinkeby/PriceConsumerV3.json', 'utf8'));
  //const priceConsumer_Contract=JSON.parse(fs.readFileSync('artifacts/contracts/PriceConsumerV3.sol/PriceConsumerV3.json', 'utf8'));


  let deployer, receiver, linkToken, priceConsumer, amount

  
    beforeEach(async () => {
      [deployer, receiver] = await ethers.getSigners()
      // link contract
      linkToken = new ethers.Contract(linkTokenAddress, link_Token.abi, deployer)
      // priceConsumer contract
      priceConsumer = new ethers.Contract(priceConsumer_Contract.address, priceConsumer_Contract.abi, deployer)
      // transfer link to priceConsumer contract
      amount = parseEther("1");
      var result = await linkToken.transfer(priceConsumer.address, amount)
      

  })

  it('should contain LINK', async () => {
    let balance = await linkToken.balanceOf(priceConsumer.address)
    console.log(balance.toString())
  })
})
