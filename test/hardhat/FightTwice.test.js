const fs = require('fs');
const { networkConfig } = require('../../helper-hardhat-config');
require("@nomiclabs/hardhat-web3") // web3
require("@nomiclabs/hardhat-ethers")
require('dotenv').config()
const hre = require("hardhat");
const { expect, expectEvent } = require('chai');


let fightTwice, fightTwiceWeb3, vrfCoordinatorMock, nftBase, seed, link, keyhash, accounts, alice
const RANDOM_NUMBER_VRF_WIN = '777' // odd to win
const RANDOM_NUMBER_VRF_LOSE = '778' // evens to lose

async function checkWinLoseEvent(isWin, requestId, randomNumber) {
   let eventName = isWin? "Win": "Lose"
   let events = await fightTwiceWeb3.getPastEvents(eventName)
   expect(events[0].event).to.equal(eventName)
   expect(events[0].returnValues.requestId).to.equal(requestId)
   expect(events[0].returnValues._better).to.equal(alice.address)
   expect(events[0].returnValues.randomNumber).to.equal(randomNumber)
}

    it('deploys contracts and set variables', async () => {
        const MockLink = await ethers.getContractFactory("MockLink")
        const FightTwice = await ethers.getContractFactory("FightTwice")
        const NFTBase = await ethers.getContractFactory("NFTBase")
        const VRFCoordinatorMock = await ethers.getContractFactory("VRFCoordinatorMock")
        keyhash = '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4'
        fee = '1000000000000000000'
        seed = 123
        link = await MockLink.deploy()
        vrfCoordinatorMock = await VRFCoordinatorMock.deploy(link.address)
        fightTwice = await FightTwice.deploy(vrfCoordinatorMock.address, link.address, keyhash)
        nftBase = await NFTBase.deploy()
        accounts = await hre.ethers.getSigners()
        alice = accounts[0]
        const contract = JSON.parse(fs.readFileSync('artifacts/contracts/FightTwice.sol/FightTwice.json', 'utf8'))
        fightTwiceWeb3 = new web3.eth.Contract(contract.abi, fightTwice.address)
    })

    it('should send link to the deployed contract', async () => {
        let amount = '2000000000000000000' // if this is a string it will overflow
        await link.transfer(fightTwice.address, amount)

        let balance = await link.balanceOf(fightTwice.address)
        expect(balance).to.equal(amount)
        console.log('Amount of LINK tokens in the contract:', ethers.utils.formatEther(balance));
    })

    it('should mint NFT', async () => {
        await nftBase.mint(alice.address, 0); // tokenId = 0
        await nftBase.mint(alice.address, 1); // tokenId = 1
        await nftBase.mint(alice.address, 2); // tokenId = 2
        await nftBase.mint(alice.address, 3); // tokenId = 3

        let nftNum = (await nftBase.balanceOf(alice.address)).toNumber()
        expect(nftNum).to.equal(4)
    })

    it('should batch mint from 10 to 19', async () => {
        await nftBase.batchMint(alice.address, 10);

        let nftNum = (await nftBase.balanceOf(alice.address)).toNumber()
        expect(nftNum).to.equal(14)
    })

    it('checks balance before bet', async () => {
        let nftNum = (await nftBase.balanceOf(alice.address)).toNumber()
        console.log("Before Bet: balance Alice", nftNum)
        expect(nftNum).to.equal(14)

        nftNum = (await nftBase.balanceOf(fightTwice.address)).toNumber()
        console.log("Before Bet: balance N.F.T", nftNum)
        expect(nftNum).to.equal(0)
    })

    it('should send NFT to FightTwice: should lose as no NFTs in contract', async () => {
        tx = await nftBase._safeTransferFrom(alice.address, fightTwice.address, 0, 123 ) // tokenId = 0
        receipt = await tx.wait()
        requestId = receipt.events[5].data.substring(0,66)
        console.log(requestId)

        // Test the result of the random number request
        tx = await vrfCoordinatorMock.callBackWithRandomness(requestId, RANDOM_NUMBER_VRF_WIN, fightTwice.address)
        let randomNumber = await fightTwice.requestIdToRandomNumber(requestId)
        expect(randomNumber).to.equal(RANDOM_NUMBER_VRF_WIN)
        await checkWinLoseEvent(false, requestId, RANDOM_NUMBER_VRF_WIN) // win if the random number is an odd number, BUT!! lose if there is no NFTs in the contract
        arrLength = await fightTwice.NFTsLen()
        expect(arrLength).to.equal(1)

        nftNum = (await nftBase.balanceOf(alice.address)).toNumber()
        expect(nftNum).to.equal(13)

        nftNum = (await nftBase.balanceOf(fightTwice.address)).toNumber()
        expect(nftNum).to.equal(1)
    })

    it('checks owners', async () => {
        let owner_0 = await nftBase.ownerOf(0)
        let owner_1 = await nftBase.ownerOf(1)
        let owner_2 = await nftBase.ownerOf(2)
        let owner_3 = await nftBase.ownerOf(3)

        expect(owner_0).to.equal(fightTwice.address)
        expect(owner_1).to.equal(alice.address)
        expect(owner_2).to.equal(alice.address)
        expect(owner_3).to.equal(alice.address)
    })

    it('should win', async () => {

        // let tx0 = await nftSimple.transferFrom(alice.address, neverFightTwice.address, 0) // tokenId = 0
        let tx = await nftBase._safeTransferFrom(alice.address, fightTwice.address, 1, 123) // tokenId = 1
        receipt = await tx.wait()
        requestId = receipt.events[5].data.substring(0,66)

        await vrfCoordinatorMock.callBackWithRandomness(requestId, RANDOM_NUMBER_VRF_WIN, fightTwice.address)
        randomNumber = await fightTwice.requestIdToRandomNumber(requestId)
        expect(randomNumber).to.equal(RANDOM_NUMBER_VRF_WIN)
        await checkWinLoseEvent(true, requestId, RANDOM_NUMBER_VRF_WIN) // win cause there is NFT in the contract
        arrLength = await fightTwice.NFTsLen()
        expect(arrLength).to.equal(0)

        nftNum = (await nftBase.balanceOf(alice.address)).toNumber()
        console.log("balance Alice",nftNum)
        expect(nftNum).to.equal(14)

        nftNum = (await nftBase.balanceOf(fightTwice.address)).toNumber()
        console.log("balance N.F.T", nftNum)
        expect(nftNum).to.equal(0)
    })

    it('should lose as there are no NFTs in contract', async () => {
        let tx = await nftBase._safeTransferFrom(alice.address, fightTwice.address, 2, 123) // tokenId = 1
        receipt = await tx.wait()
        requestId = receipt.events[5].data.substring(0,66)

        await vrfCoordinatorMock.callBackWithRandomness(requestId, RANDOM_NUMBER_VRF_LOSE, fightTwice.address)
        randomNumber = await fightTwice.requestIdToRandomNumber(requestId)
        expect(randomNumber).to.equal(RANDOM_NUMBER_VRF_LOSE)
        await checkWinLoseEvent(false, requestId, RANDOM_NUMBER_VRF_LOSE) // win as there is an NFT in the contract
        arrLength = await fightTwice.NFTsLen()
        expect(arrLength).to.equal(1)

        nftNum = (await nftBase.balanceOf(alice.address)).toNumber()
        expect(nftNum).to.equal(13)

        nftNum = (await nftBase.balanceOf(fightTwice.address)).toNumber()
        expect(nftNum).to.equal(1)
    })

    it('checks all owners', async () => {
        let owner_0 = await nftBase.ownerOf(0)
        let owner_1 = await nftBase.ownerOf(1)
        let owner_2 = await nftBase.ownerOf(2)
        let owner_3 = await nftBase.ownerOf(3)

        expect(owner_0).to.equal(alice.address)
        expect(owner_1).to.equal(alice.address)
        expect(owner_2).to.equal(fightTwice.address)
        expect(owner_3).to.equal(alice.address)
    })

    it('should lose', async () => {
        let tx = await nftBase._safeTransferFrom(alice.address, fightTwice.address, 3, 123) // tokenId = 3
        receipt = await tx.wait()
        requestId = receipt.events[5].data.substring(0,66)

        await vrfCoordinatorMock.callBackWithRandomness(requestId, RANDOM_NUMBER_VRF_LOSE, fightTwice.address)
        randomNumber = await fightTwice.requestIdToRandomNumber(requestId)
        expect(randomNumber).to.equal(RANDOM_NUMBER_VRF_LOSE)
        await checkWinLoseEvent(false, requestId, RANDOM_NUMBER_VRF_LOSE) 
        arrLength = await fightTwice.NFTsLen()
        expect(arrLength).to.equal(2)

        nftNum = (await nftBase.balanceOf(alice.address)).toNumber()
        console.log("balance Alice",nftNum)
        expect(nftNum).to.equal(12)

        nftNum = (await nftBase.balanceOf(fightTwice.address)).toNumber()
        console.log("balance N.F.T", nftNum)
        expect(nftNum).to.equal(2)

    })

    it('checks owners', async () => {
        let owner_0 = await nftBase.ownerOf(0)
        let owner_1 = await nftBase.ownerOf(1)
        let owner_2 = await nftBase.ownerOf(2)
        let owner_3 = await nftBase.ownerOf(3)

        expect(owner_0).to.equal(alice.address)
        expect(owner_1).to.equal(alice.address)
        expect(owner_2).to.equal(fightTwice.address)
        expect(owner_3).to.equal(fightTwice.address)
    })

    it('should win', async () => {
        let tx = await nftBase._safeTransferFrom(alice.address, fightTwice.address, 1, 123)
        receipt = await tx.wait()
        requestId = receipt.events[5].data.substring(0, 66)
        await vrfCoordinatorMock.callBackWithRandomness(requestId, RANDOM_NUMBER_VRF_WIN, fightTwice.address)
        randomNumber = await fightTwice.requestIdToRandomNumber(requestId)
        expect(randomNumber).to.equal(RANDOM_NUMBER_VRF_WIN)
        await checkWinLoseEvent(true, requestId, RANDOM_NUMBER_VRF_WIN) // win as there is an NFT in the contract
        arrLength = await fightTwice.NFTsLen()
        expect(arrLength).to.equal(1)

        nftNum = (await nftBase.balanceOf(alice.address)).toNumber()
        expect(nftNum).to.equal(13)

        nftNum = (await nftBase.balanceOf(fightTwice.address)).toNumber()
        expect(nftNum).to.equal(1)
    })

    it('checks owners', async () => {
        let owner_0 = await nftBase.ownerOf(0)
        let owner_1 = await nftBase.ownerOf(1)
        let owner_2 = await nftBase.ownerOf(2)
        let owner_3 = await nftBase.ownerOf(3)

        expect(owner_0).to.equal(alice.address)
        expect(owner_1).to.equal(alice.address)
        expect(owner_2).to.equal(alice.address)
        expect(owner_3).to.equal(fightTwice.address)
    })

    it('should lose', async () => {
        let tx = await nftBase._safeTransferFrom(alice.address, fightTwice.address, 1, 123) // toknId = 1
        receipt = await tx.wait()
        requestId = receipt.events[5].data.substring(0,66)
        await vrfCoordinatorMock.callBackWithRandomness(requestId, RANDOM_NUMBER_VRF_LOSE, fightTwice.address)
        randomNumber = await fightTwice.requestIdToRandomNumber(requestId)
        expect(randomNumber).to.equal(RANDOM_NUMBER_VRF_LOSE)
        await checkWinLoseEvent(false, requestId, RANDOM_NUMBER_VRF_LOSE)
        arrLength = await fightTwice.NFTsLen()
        expect(arrLength).to.equal(2)

        nftNum = (await nftBase.balanceOf(alice.address)).toNumber()
        expect(nftNum).to.equal(12)

        nftNum = (await nftBase.balanceOf(fightTwice.address)).toNumber()
        expect(nftNum).to.equal(2)
    })

    it('checks owners', async () => {
        let owner_0 = await nftBase.ownerOf(0)
        let owner_1 = await nftBase.ownerOf(1)
        let owner_2 = await nftBase.ownerOf(2)
        let owner_3 = await nftBase.ownerOf(3)

        expect(owner_0).to.equal(alice.address)
        expect(owner_1).to.equal(fightTwice.address)
        expect(owner_2).to.equal(alice.address)
        expect(owner_3).to.equal(fightTwice.address)
    })

    it('should lose', async () => {
        let tx = await nftBase._safeTransferFrom(alice.address, fightTwice.address, 2, 123 )
        receipt = await tx.wait()
        requestId = receipt.events[5].data.substring(0,66)
        await vrfCoordinatorMock.callBackWithRandomness(requestId, RANDOM_NUMBER_VRF_LOSE, fightTwice.address)
        randomNumber = await fightTwice.requestIdToRandomNumber(requestId)
        expect(randomNumber).to.equal(RANDOM_NUMBER_VRF_LOSE)
        await checkWinLoseEvent(false, requestId, RANDOM_NUMBER_VRF_LOSE)
        arrLength = await fightTwice.NFTsLen()
        expect(arrLength).to.equal(3)

        nftNum = (await nftBase.balanceOf(alice.address)).toNumber()
        expect(nftNum).to.equal(11)

        nftNum = (await nftBase.balanceOf(fightTwice.address)).toNumber()
        expect(nftNum).to.equal(3)
    })

    it('checks owners', async () => {
        let owner_0 = await nftBase.ownerOf(0)
        let owner_1 = await nftBase.ownerOf(1)
        let owner_2 = await nftBase.ownerOf(2)
        let owner_3 = await nftBase.ownerOf(3)

        expect(owner_0).to.equal(alice.address)
        expect(owner_1).to.equal(fightTwice.address)
        expect(owner_2).to.equal(fightTwice.address)
        expect(owner_3).to.equal(fightTwice.address)
    })

    it('should lose', async () => {
        let tx = await nftBase._safeTransferFrom(alice.address, fightTwice.address, 0, 123 )
        receipt = await tx.wait()
        requestId = receipt.events[5].data.substring(0,66)
        await vrfCoordinatorMock.callBackWithRandomness(requestId, RANDOM_NUMBER_VRF_LOSE, fightTwice.address)
        randomNumber = await fightTwice.requestIdToRandomNumber(requestId)
        expect(randomNumber).to.equal(RANDOM_NUMBER_VRF_LOSE)
        await checkWinLoseEvent(false, requestId, RANDOM_NUMBER_VRF_LOSE)
        arrLength = await fightTwice.NFTsLen()
        expect(arrLength).to.equal(4)

        nftNum = (await nftBase.balanceOf(alice.address)).toNumber()
        expect(nftNum).to.equal(10)

        nftNum = (await nftBase.balanceOf(fightTwice.address)).toNumber()
        expect(nftNum).to.equal(4)
    })

