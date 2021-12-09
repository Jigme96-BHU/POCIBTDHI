//SPDX-License-Identifier: MIT

pragma solidity >=0.5.0 <0.9.0;

contract PowerUp {

    mapping(address => uint256) public power;
    mapping(bytes32 => uint256) private hashes;

    event powerAdded(
        address station,
        uint256 value,
        uint256 total,
        bytes32 hash
    );

    modifier hashOnlyOnces(bytes32 hash){
        require(0 == hashes[hash]);
        _;
    }

    function add(
        uint256 value,
        bytes32 hash
    )public hashOnlyOnces(hash) {
        power[msg.sender] += value;
        hashes[hash] = block.number;
        emit powerAdded(msg.sender,value, power[msg.sender],hash);
    }

    function total() public view returns(uint256) {

        return power[msg.sender];

    }

    function validate(bytes32 hash)public view returns(uint256){
        return hashes[hash];
    }

}