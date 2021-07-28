let { networkConfig } = require('../helper-hardhat-config')

module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId
}) => {
  const { deploy, get, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = await getChainId()
  let linkTokenAddress
  let vrfCoordinatorAddress
  let additionalMessage = ""

  if (chainId == 31337) {
    linkToken = await get('LinkToken')
    VRFCoordinatorMock = await get('VRFCoordinatorMock')
    linkTokenAddress = linkToken.address
    vrfCoordinatorAddress = VRFCoordinatorMock.address
    additionalMessage = " --linkaddress " + linkTokenAddress
  } else {
    linkTokenAddress = networkConfig[chainId]['linkToken']
    vrfCoordinatorAddress = networkConfig[chainId]['vrfCoordinator']
  }
  const keyHash = networkConfig[chainId]['keyHash']
  const fee = networkConfig[chainId]['fee']

  //const linkToken = await deploy('LinkToken', { from: deployer, log: true })

  const fightTwice = await deploy('FightTwice', {
    from: deployer,
    args: [vrfCoordinatorAddress, linkTokenAddress, keyHash],
    log: true
  })

  log("Run the following command to fund contract with LINK:")
  log("npx hardhat fund-link --contract " + fightTwice.address + additionalMessage)
  log("Then run NFTSimple contract with the following command, replacing '777' with your chosen seed number:")
  log("npx hardhat request-random-number --contract " + fightTwice.address, " --seed '777'" )
  log("----------------------------------------------------")
}

module.exports.tags = ['all', 'fightTwice']