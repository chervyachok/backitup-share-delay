// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IERC6538.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { IEventEmitter } from "./EventEmitter.sol";
import "hardhat/console.sol";

contract Registry  { 
    // EIP-712 Domain Separator
    bytes32 public constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 public constant REGISTER_TYPEHASH = keccak256(
        "RegisterWithSign(address owner,bytes stealthMetaAddress,uint40 expire)"
    );
    bytes32 public immutable DOMAIN_SEPARATOR;
    IEventEmitter public immutable eventEmitter;

    /// @notice Maps a registrant's identifier to the stealth meta-address.  
    mapping(address => bytes) public stealthMetaAddresses;
    mapping(address => mapping(bytes32 => bool)) public nonces;  
    
    constructor(IEventEmitter _eventEmitter) { 
        eventEmitter = _eventEmitter;

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256("BuckitUpRegistry"), 
                keccak256("1"), // Version
                block.chainid, 
                address(this) 
            )
        );
    }

    /// @notice Sets the caller's stealth meta-address.
    function register(bytes memory stealthMetaAddress) external {
        _register(msg.sender, stealthMetaAddress);
    }

    /// @notice Sets the `owner`s stealth meta-address.    
    function registerWithSign(
        address owner,
        bytes memory stealthMetaAddress,
        uint40 expire, 
        bytes memory signature        
    ) external notExpired(expire) {        
        // Create the hash of the typed data
        bytes32 structHash = keccak256(
            abi.encode(
                REGISTER_TYPEHASH,
                owner,                
                keccak256(stealthMetaAddress), // Hash the bytes array
                expire
            )
        );
         
        require(_recoverSigner(structHash, signature) == owner, "Invalid signature");       
        _register(owner, stealthMetaAddress);
    }

    function _register(address owner, bytes memory stealthMetaAddress) internal {
        stealthMetaAddresses[owner] = stealthMetaAddress;
        eventEmitter.emitEvent("Register", abi.encode(owner, stealthMetaAddress));
    }

    function _recoverSigner(bytes32 structHash, bytes memory signature) internal returns (address signer) {
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );
        
        signer = ECDSA.recover(digest, signature);

        require(!nonces[signer][digest], "Tx duplicate");
        nonces[signer][digest] = true; 
    }

    modifier notExpired(uint40 expire) {
        require(expire > block.timestamp, "Tx expired");
        _;
    }

    function supportsInterface(bytes4 interfaceID) public pure returns(bool) {
        return interfaceID == type(IERC6538).interfaceId;
    }
}
