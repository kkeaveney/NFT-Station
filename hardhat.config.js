/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-ethers")
require("@nomiclabs/hardhat-truffle5")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("./tasks/accounts")
require("./tasks/balance")
require("./tasks/fund-link")
require("./tasks/block-number")
require("./tasks/block-number")
require("./tasks/random-number-consumer")
require("./tasks/price-consumer")
require("./tasks/api-consumer")


require('dotenv').config()
// optional


module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            // If you want to do some forking, uncomment this
            forking: {
              url: process.env.MAINNET_RPC_URL
            }
        },
        localhost: {
        },
        kovan: {
            url: process.env.KOVAN_RPC_URL,
            // accounts: [PRIVATE_KEY],
            accounts: {
                mnemonic: process.env.MNEMONIC,
            },
            saveDeployments: true,
        },
        rinkeby: {
            url: process.env.RINKEBY_RPC_URL,
            // accounts: [PRIVATE_KEY],
            accounts: {
                mnemonic: process.env.MNEMONIC,
            },
            saveDeployments: true,
        },
        ganache: {
            url: 'http://localhost:8545',
            accounts: {
                mnemonic: process.env.MNEMONIC,
            }
        }
    },
    etherscan: {
        // Your API key for Etherscan
        // Obtain one at https://etherscan.io/
        apiKey: process.env.ETHERSCAN_API_KEY
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0 // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
        feeCollector: {
            default: 1
        }
    },
    solidity: {
        compilers: [
            {
                version: "0.6.6"
            },
            {
                version: "0.4.24"
            }
        ]
    },
    mocha: {
        timeout: 100000
    }
}
