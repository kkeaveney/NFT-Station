const fs = require('fs');
const { expect } = require('chai');
var sleep = require('sleep');

/**
 * Constructor inherits VRFConsumerBase
 *
 * Network: Rinkeby
 * Chainlink VRF Coordinator address: 0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B
 * LINK token address:                0x01be23585060835e02b77ef475b0cc51aa1e0709
 * Key Hash: 0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311
 */

const linkTokenAddress="0x01BE23585060835E02B77ef475b0Cc51aA1e0709"

const RandomNumberConsumer=JSON.parse(fs.readFileSync('deployments/rinkeby/RandomNumberConsumer.json', 'utf8'));
const VRFCoordinator=JSON.parse(fs.readFileSync('deployments/rinkeby/VRFCoordinatorMock.json', 'utf8'));
const vrfCoordinatorAddress="0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B"
const LinkToken=JSON.parse(fs.readFileSync('deployments/rinkeby/LinkToken.json', 'utf8'));

let linkTokenContract, randomNumberConsumer

    describe('deployment', async () => {

        // Get signer information
        const accounts = await hre.ethers.getSigners()
        const [deployer] = accounts
        const amount = '2000000000000000000' // if this is a string it will overflow

        it('deploys contracts', async() => {
            linkTokenContract = new ethers.Contract(LinkToken.address, LinkToken.abi, deployer)
            vrfCoordinator = new ethers.Contract(VRFCoordinator.address, VRFCoordinator.abi, deployer)
            randomNumberConsumer = new ethers.Contract(RandomNumberConsumer.address, RandomNumberConsumer.abi, deployer)
        })

        it('transfers LINK to RandomNumberConsumer contract', async() => {
            let tx = await linkTokenContract.transfer(randomNumberConsumer.address, amount)
            let res = await tx.wait()
            let balance = await linkTokenContract.balanceOf(randomNumberConsumer.address)
            expect(balance).to.not.equal(0)
        })

        it('tests the repsonse of the random number request', async() => {
            tx = await randomNumberConsumer.getRandomNumber(123)
            let response = await tx.wait()
            //console.log(response.events[3].data)
            randomNumber = await randomNumberConsumer.randomResult()

            expect(randomNumber).to.not.equal(0)
            await sleep.sleep(30)

            tx = await randomNumberConsumer.getRandomNumber(12343)
            response = await tx.wait()

            let newRandomNumber = await randomNumberConsumer.randomResult()
            expect(randomNumber).to.not.equal(newRandomNumber)
        })
})











