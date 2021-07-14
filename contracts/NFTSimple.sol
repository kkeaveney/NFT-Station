pragma solidity 0.6.6;

import "@chainlink/contracts/src/v0.6/VRFConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";

contract NFTSimple is VRFConsumerBase, ERC721 {

    uint256 internal numOfCollectibles;
    uint256 public tokenCounter;
    bytes32 internal keyHash;
    uint256 internal fee;


    enum Breed{PUG, SHIB_INU, ST_BERNARD}

    mapping(bytes32 => address) public requestIdToSender;
    mapping(bytes32 => string) public requestIdToTokenURI;
    mapping(uint256 => Breed) public tokenIdToBreed;

    event RequestCollectible(bytes32 requestId);

    /**
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
        keyHash = _keyHash;
        fee = _fee;
        tokenCounter = 0;
    }

    function _safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        safeTransferFrom(from, to, tokenId, data);
    }

    /**
     * Requests randomness from a user-provided seed
     */
    function createCollectibles(uint256 amount, string memory tokenURI, uint256 userProvidedSeed) public returns (bytes32 requestId) {
        requestId = requestRandomness(keyHash, fee, userProvidedSeed);
        requestIdToSender[requestId] = msg.sender;
        requestIdToTokenURI[requestId] = tokenURI;
        numOfCollectibles = amount;
        emit RequestCollectible(requestId);
    }

    /**
     * Callback function used by VRF Coordinator
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        address owner = requestIdToSender[requestId];
        string memory tokenURI = requestIdToTokenURI[requestId];

        for(uint256 i = 0; i <= numOfCollectibles; i++) {
            //bytes32 previousBlockHash = blockhash(block.number-1);
            uint256 newItemId = uint256(keccak256(abi.encodePacked(randomness, i)));

            _safeMint(owner, newItemId);
            _setTokenURI(newItemId, tokenURI);

            Breed breed = Breed(randomness % 3);
            tokenIdToBreed[newItemId] = breed;
        }

        numOfCollectibles = 0;
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) public {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "ERC721: transfer caller is not owner nor approved"
        );
        _setTokenURI(tokenId, _tokenURI);
    }


    function getTransactionFromIndex(uint256 index) public view returns(uint256, Breed ){
        uint256 tokenId = tokenByIndex(index);
        Breed breed = Breed(tokenIdToBreed[tokenId]);
        return (tokenId, breed);
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



