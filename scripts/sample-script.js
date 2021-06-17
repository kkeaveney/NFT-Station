var fs = require('file-system');
// Require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with hardhat run <script> you'll find the Hardhat 
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat")
const hre = require("hardhat")


//LINK Token address set to Rinkeby address. Can get other values at https://docs.chain.link/docs/link-token-contracts
//VRF Details set for Rinkeby environment, can get other values at https://docs.chain.link/docs/vrf-contracts#config

const LINK_TOKEN_ADDR="0x01BE23585060835E02B77ef475b0Cc51aA1e0709"
const NFTSimple_ADDR=JSON.parse(fs.readFileSync('deployments/rinkeby/NFTSimple.json', 'utf8'));
const NFTSimple_Contract = JSON.parse(fs.readFileSync('artifacts/contracts/NFTSimple.sol/NFTSimple.json', 'utf8'));
const VRF_COORDINATOR="0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B"
const VFT_FEE="100000000000000000"
const VFT_KEYHASH="0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311"
const LINK_TOKEN_ABI='[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_data","type":"bytes"}],"name":"transferAndCall","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"data","type":"bytes"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"}]' 

async function main() {
// Hardhat always runs the compile task when running scripts with its command line interface
// If this script is run directly using `node` you may want to call compile
// manually to make sure everything is compiled
// await hre.run('compile')

// Get signer information
const accounts = await hre.ethers.getSigners()
let [deployer, receiver] = accounts

// Get contract to deploy
const nftSimple = new ethers.Contract(NFTSimple_ADDR.address, NFTSimple_Contract.abi, deployer)

// Fund the contract with 1 LINK
// npx hardhat fund-link --contract
let contractAddr = NFTSimple_ADDR.address
const amount = web3.utils.toHex(1e18)

const linkTokenContract = new ethers.Contract(LINK_TOKEN_ADDR, LINK_TOKEN_ABI, deployer)
var result = await linkTokenContract.transfer(contractAddr, amount).then(function (transaction) {
    console.log('Contract funded with 1 LINK. Transaction Hash:', transaction.hash)
})

console.log(nftSimple.address)
console.log(linkTokenContract.address)

// Check the balance of the contract
let balance = await linkTokenContract.balanceOf(nftSimple.address)
console.log("Amount of LINK tokens in the NFT contract:", ethers.utils.formatEther(balance))

// Check totalsupply of NFTs
let totalSupply = await nftSimple.totalSupply()
console.log('Total supply of minted NFTs', totalSupply.toNumber())

// Mint an NFT and send it to the deployer
let nftNumber = totalSupply++ // id to mint
await nftSimple.mint(deployer.address, nftNumber)

// Get tokenId of last minted NFT
let tokenIndex = await nftSimple.tokenByIndex(nftNumber -1)

// // Transfer NFT to another address
await nftSimple.transferFrom(deployer.address, receiver.address, tokenIndex)
console.log('Number of NFTs owned by deployer', (await nftSimple.balanceOf(deployer.address)).toNumber())
console.log('Number of NFTs owned by receiver', (await nftSimple.balanceOf(receiver.address)).toNumber())
}

// Recommended pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    })