let { networkConfig } = require('../helper-hardhat-config')

module.exports = async ({
    getNamedAccounts,
    deployments,
    getChainId
}) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const linkToken = await deploy('LinkToken', {
        from: deployer,
        log: true
    })
    const vrfCoordinatorMock = await deploy('VRFCoordinatorMock', {
        from: deployer,
        log: true,
        args: [linkToken.address]
    })
    const nFTSimple = await deploy('NFTSimple', {
        from: deployer,
        log: true,
        args:[vrfCoordinatorMock.address, linkToken.address, '0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311']
    })
    log('VRFCoordinatorMock at ' + vrfCoordinatorMock.address)
    log("NFTSimple deployed at" + nFTSimple.address )
    log("LINK deployed at" + linkToken.address )
    log("----------------------------------------------------")
}

module.exports.tags = ['all', 'nFTSimple']
