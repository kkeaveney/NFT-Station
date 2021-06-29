
pragma solidity 0.6.6;

import "@chainlink/contracts/src/v0.6/VRFConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";

contract RandomNumberConsumer is ERC721, VRFConsumerBase {


    bytes32 internal keyHash;
    uint256 internal fee;
    uint256 public randomResult;
    uint256 public tokenCounter;
    enum Breed {PUB, SHIB_INU, BRENARD}

    mapping (bytes32 => address) public requestIdToSender;
    mapping (bytes32 => string) public requestIdToTokenURI;
    mapping (uint256 => Breed) public tokenIdToBreed;
    mapping (bytes32 => uint256) public requestIdtoTokenId;

    event RequestedCollectible(bytes32 indexed requestId);

    /**
 * Constructor inherits VRFConsumerBase
 *
 * Network: Rinkeby
 * Chainlink VRF Coordinator address: 0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B
 * LINK token address:                0x01be23585060835e02b77ef475b0cc51aa1e0709
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
    /**
     * Requests randomness from a user-provided seed
     */
    function getRandomNumber(uint256 userProvidedSeed) public returns (bytes32 requestId) {
        requestId = requestRandomness(keyHash, fee, userProvidedSeed);

    }

    function createCollectible(string memory tokenURI, uint256 userProvidedSeed) public returns (bytes32 requestId) {
        requestId = requestRandomness(keyHash, fee, userProvidedSeed);
        requestIdToSender[requestId] = msg.sender;
        requestIdToTokenURI[requestId] = tokenURI;
        emit RequestedCollectible(requestId);
    }

    /**
     * Callback function used by VRF Coordinator
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomNumber) internal override {
        address dogOwner = requestIdToSender[requestId];
        string memory tokenURI = requestIdToTokenURI[requestId];
        uint256 newItemId = tokenCounter;
        _safeMint(dogOwner, newItemId);
        _setTokenURI(newItemId, tokenURI);
        Breed breed = Breed(randomNumber % 3);
        tokenIdToBreed[newItemId] = breed;
    }
    /**
     * Withdraw LINK from this contract
     *
     * DO NOT USE THIS IN PRODUCTION AS IT CAN BE CALLED BY ANY ADDRESS.
     * THIS IS PURELY FOR EXAMPLE PURPOSES.
     */
    function withdrawLink() external {
        require(LINK.transfer(msg.sender, LINK.balanceOf(address(this))), "Unable to transfer");
    }
}
