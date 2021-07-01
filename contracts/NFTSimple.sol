pragma solidity 0.6.6;

import "@chainlink/contracts/src/v0.6/VRFConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";

contract NFTSimple is VRFConsumerBase, ERC721 {

    uint256 public tokenCounter;
    bytes32 internal keyHash;
    uint256 internal fee;


    enum Breed{PUG, SHIB_INU, ST_BERNARD}

    mapping(bytes32 => address) public requestIdToSender;
    mapping(bytes32 => string) public requestIdToTokenURI;
    mapping(uint256 => Breed) public tokenIdToBreed;
    mapping(bytes32 => uint256) public requestIdToTokenId;

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

     // mint a batch of x tokens.
    function batchMint(address to, uint256 number, string memory tokenURI,uint256 userProvidedSeed)
    public {
        bytes32 previousBlockHash = blockhash(block.number-1);
        uint256 startId = uint256(keccak256(abi.encodePacked(previousBlockHash,msg.sender)));
        for(uint256 i=0;i<number;i++){

            createCollectible(tokenURI, userProvidedSeed+i);
            _safeMint(to,startId+i);
            _setTokenURI(startId+i, tokenURI);
        }
    }

    function _safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        safeTransferFrom(from, to, tokenId, data);
    }

    /**
     * Requests randomness from a user-provided seed
     */
    function createCollectible(string memory tokenURI, uint256 userProvidedSeed) public returns (bytes32 requestId) {
        requestId = requestRandomness(keyHash, fee, userProvidedSeed);
        requestIdToSender[requestId] = msg.sender;
        requestIdToTokenURI[requestId] = tokenURI;
        emit RequestCollectible(requestId);
    }

    /**
     * Callback function used by VRF Coordinator
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        address dogOwner = requestIdToSender[requestId];
        string memory tokenURI = requestIdToTokenURI[requestId];
        uint256 newItemId = tokenCounter;
        // _safeMint(dogOwner, newItemId);
        // _setTokenURI(newItemId, tokenURI);
        Breed breed = Breed(randomness % 3);
        tokenIdToBreed[newItemId] = breed;
        requestIdToTokenId[requestId] = newItemId;
        tokenCounter = tokenCounter++;
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) public {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "ERC721: transfer caller is not owner nor approved"
        );
        _setTokenURI(tokenId, _tokenURI);
    }


    function requestIdTransaction(bytes32 requestId) public view returns(address, string memory, uint256, Breed ){
        address owner = requestIdToSender[requestId];
        string memory tokenURI = requestIdToTokenURI[requestId];
        uint256 tokenId = requestIdToTokenId[requestId];
        Breed breed = Breed(tokenIdToBreed[0]);
        return (owner, tokenURI, tokenId, breed);
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
