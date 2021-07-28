let { networkConfig } = require('../helper-hardhat-config')


module.exports = async ({
  getNamedAccounts,
  deployments
}) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  let additionalMessage = ""


  const nftBase = await deploy('NFTBase', {
    from: deployer,
    args: [],
    log: true
  })

  log("Run the following command to fund contract with LINK:")
  log("npx hardhat fund-link --contract " + nftBase.address + additionalMessage)
  log("----------------------------------------------------")
}

module.exports.tags = ['all', 'nftBase']