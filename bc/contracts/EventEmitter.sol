// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

interface IEventEmitter {
    function emitEvent(string memory action, bytes memory data) external;
}

contract EventEmitter is IEventEmitter, Ownable {

    mapping(address => bool) public emitters;  

    function setEmitter(address emitter, bool state) public onlyOwner() {
        emitters[emitter] = state;
    }

    function emitEvent(string memory action, bytes memory data) public {
        if (emitters[msg.sender]) {
            emit Event(action, data, uint40(block.timestamp), tx.origin, msg.sender);
        }
	}
		
    event Event(string action, bytes data, uint256 timestamp, address origin, address emitter);	
}
