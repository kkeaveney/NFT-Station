let { networkConfig } = require('../helper-hardhat-config')

module.exports = async ({
    getNamedAccounts,
    deployments,
    getChainId
}) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = await getChainId()
  
    const nFTSimple = await deploy('NFTSimple', {
        from: deployer,
        log: true
    })
    log("simpleNFT deployed at" + nFTSimple.address )
    log("----------------------------------------------------")
}

module.exports.tags = ['all', 'nFTSimple']
