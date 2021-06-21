pragma solidity ^0.6.6;

contract MyContract {

    string public name;

    constructor() public {}

    function setName(string memory _name) public  {
        name = _name;
    }

    function getName() public view returns (string memory) {
        return name;
    }

    
}