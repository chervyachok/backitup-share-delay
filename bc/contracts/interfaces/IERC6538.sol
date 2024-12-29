// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC6538 {
    /// @dev Emitted when a registrant updates their stealth meta-address.
    event StealthMetaAddressSet(
        bytes indexed registrant, uint256 indexed scheme, bytes stealthMetaAddress
    );

    /// @notice Sets the caller's stealth meta-address for the given stealth address scheme.
    /// @param scheme An integer identifier for the stealth address scheme.
    /// @param stealthMetaAddress The stealth meta-address to register.
    function registerKeys(uint256 scheme, bytes memory stealthMetaAddress) external;

    /// @notice Sets the `registrant`s stealth meta-address for the given scheme.
    /// @param registrant Recipient identifier, such as an ENS name.
    /// @param scheme An integer identifier for the stealth address scheme.
    /// @param signature A signature from the `registrant` authorizing the registration.
    /// @param stealthMetaAddress The stealth meta-address to register.
    /// @dev MUST support both EOA signatures and EIP-1271 signatures.
    /// @dev MUST revert if the signature is invalid.
    function registerKeysOnBehalf(
        address registrant,
        uint256 scheme,
        bytes memory signature,
        bytes memory stealthMetaAddress
    ) external;
}
