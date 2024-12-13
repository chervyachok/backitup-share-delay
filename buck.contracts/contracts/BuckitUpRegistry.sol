// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IERC6538.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";

contract BuckitUpRegistry  { //is IERC6538

    /// @notice Maps a registrant's identifier to the scheme to the stealth meta-address.
    /// @dev Registrant may be a 160 bit address or other recipient identifier, such as an ENS name.
    /// @dev Scheme is an integer identifier for the stealth address scheme.
    /// @dev MUST return zero if a registrant has not registered keys for the given inputs.
    mapping(address => mapping(uint256 => bytes)) public stealthMetaAddressOf;

    // EIP-712 Domain Separator
    bytes32 public constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 public constant REGISTER_TYPEHASH = keccak256(
        "RegisterKeysOnBehalf(address registrant,uint256 scheme,bytes stealthMetaAddress)"
    );
    bytes32 public DOMAIN_SEPARATOR;

    constructor() { 
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256("BuckitUpRegistry"), // Contract name
                keccak256("1"), // Version
                block.chainid, // Chain ID
                address(this) // Contract address
            )
        );
    }

    /// @notice Sets the caller's stealth meta-address for the given stealth address scheme.
    /// @param scheme An integer identifier for the stealth address scheme.
    /// @param stealthMetaAddress The stealth meta-address to register.
    function registerKeys(uint256 scheme, bytes memory stealthMetaAddress) external {
        stealthMetaAddressOf[msg.sender][scheme] = stealthMetaAddress;
    }

    /// @notice Sets the `registrant`s stealth meta-address for the given scheme.
    /// @param registrant Recipient address.
    /// @param scheme An integer identifier for the stealth address scheme.
    /// @param signature A signature from the `registrant` authorizing the registration.
    /// @param stealthMetaAddress The stealth meta-address to register.
    /// @dev MUST support both EOA signatures and EIP-1271 signatures.
    /// @dev MUST revert if the signature is invalid.
    function registerKeysOnBehalf(
        address registrant,
        uint256 scheme,
        bytes memory stealthMetaAddress,
        bytes memory signature        
    ) external {
        // Create the hash of the typed data
        bytes32 structHash = keccak256(
            abi.encode(
                REGISTER_TYPEHASH,
                registrant,
                scheme,
                keccak256(stealthMetaAddress) // Hash the bytes array
            )
        );
                
        require(_recoverSigner(structHash, signature) == registrant, "Invalid signature");       
        stealthMetaAddressOf[registrant][scheme] = stealthMetaAddress;
    }

    function _recoverSigner(bytes32 structHash, bytes memory signature) internal view returns (address) {
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );
        return ECDSA.recover(digest, signature);
    }

    function supportsInterface(bytes4 interfaceID) public pure returns(bool) {
        return interfaceID == type(IERC6538).interfaceId;
    }
}
