// contracts/MyNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.6/VRFConsumerBase.sol";
import "hardhat/console.sol";


contract NFTSimple is VRFConsumerBase, ERC721 {

    bytes32 internal keyHash;
    uint256 internal fee;
    address public VRFCoordinator;
    address public LinkToken;
    uint256 public tokenCounter;

    mapping (bytes32 => address) public requestIdToSender;
    mapping (bytes32 => string) public requestIdToTokenURI;

    event RequestCollectible(bytes32 indexed requestId);

    /**
     * Constructor inherits VRFConsumerBase
     *
     * Network: Rinkeby
     * Chainlink VRF Coordinator address: 0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B
     * LINK token address:                0x01BE23585060835E02B77ef475b0Cc51aA1e0709
     * Key Hash: 0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311
     */

    constructor(address _vrfCoordinator,
                address _link,
                bytes32 _keyHash,
                uint _fee)
        VRFConsumerBase(
            _vrfCoordinator, // VRF Coordinator
            _link  // LINK Token
        ) ERC721("Doggie", "Dog") public
    {
        tokenCounter = 0;
        keyHash = _keyHash;
        fee = _fee;
    }


    function _safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        safeTransferFrom(from, to, tokenId, data);
    }

    // // mint a batch of 10 tokens.
    function batchMint(address to, uint256 number)
    public {
        bytes32 previousBlockHash = blockhash(block.number-1);
        uint256 startId = uint256(keccak256(abi.encodePacked(previousBlockHash,msg.sender)));
        for(uint256 i=0;i<number;i++){
            _safeMint(to,startId+i);
        }
    }

    function createCollectible(string memory tokenURI, uint256 userProvidedSeed) public returns (bytes32 requestId) {
        requestId = requestRandomness(keyHash, fee, userProvidedSeed);
        requestIdToSender[requestId] = msg.sender;
        requestIdToTokenURI[requestId] = tokenURI;
        emit RequestCollectible(requestId);
    }

    function getRandomNumber(uint256 userProvidedSeed) public returns (bytes32 requestId) {
        requestId = requestRandomness(keyHash, fee, userProvidedSeed);
    }

    /**
     * Callback function used by VRF Coordinator
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomNumber) internal override {
        console.log(randomNumber);
        address dogOwner = requestIdToSender[requestId];
        string memory tokenURI = requestIdToTokenURI[requestId];
        uint256 newItemId = tokenCounter;
        _safeMint(dogOwner, newItemId);
        _setTokenURI(newItemId, tokenURI);
        // Breed breed = Breed(randomNumber % 3);
        // tokenIdToBreed[newItemId] = breed;
    }

}