// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { IEventEmitter } from "./EventEmitter.sol";
import "hardhat/console.sol";

/// @title Vault contract for storing backup information.
contract Vault {
    // EIP-712 Domain Separator
    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 public constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 public constant SHARE_TYPEHASH = keccak256(
        "Share(address stealthAddress,bytes messageEncrypted,bytes ephemeralPubKey,bytes shareEncrypted,bytes shareEncryptedHash,uint40 delay,uint40 request,uint8 disabled)"
    ); 
    bytes32 public constant BACKUP_TYPEHASH = keccak256(
        "Backup(address owner,uint8 disabled,uint8 treshold,bytes commentEncrypted,Share[] shares)Share(address stealthAddress,bytes messageEncrypted,bytes ephemeralPubKey,bytes shareEncrypted,bytes shareEncryptedHash,uint40 delay,uint40 request,uint8 disabled)"
    );
    bytes32 public constant ADD_BACKUP_TYPEHASH = keccak256(
        "AddBackup(string tag,Backup backup,uint40 expire)Backup(address owner,uint8 disabled,uint8 treshold,bytes commentEncrypted,Share[] shares)Share(address stealthAddress,bytes messageEncrypted,bytes ephemeralPubKey,bytes shareEncrypted,bytes shareEncryptedHash,uint40 delay,uint40 request,uint8 disabled)"
    );
    bytes32 public constant UPDATE_BACKUP_DISABLED_TYPEHASH = keccak256(
        "UpdateBackupDisabled(string tag,uint8 disabled,uint40 expire)"
    ); 
    bytes32 public constant UPDATE_SHARE_DISABLED_TYPEHASH = keccak256(
        "UpdateShareDisabled(string tag,uint8 idx,uint8 disabled,uint40 expire)"
    );  
    bytes32 public constant UPDATE_SHARE_DELAY_TYPEHASH = keccak256(
        "UpdateShareDelay(string tag,uint8 idx,uint40 delay,uint40 expire)"
    );    
    bytes32 public constant REQUEST_RECOVER_TYPEHASH = keccak256(
        "RequestRecover(string tag,uint8 idx,uint40 expire)"
    );   

    IEventEmitter public immutable eventEmitter;
    /// @notice The structure defining a backup.
    /// @dev The backup contains the owner's address, a list of stealth addresses, the ephemeral public key used to generate the address and the SSSPortions.
    
    struct Share {        
        address stealthAddress;
        bytes messageEncrypted;
        bytes ephemeralPubKey;
        bytes shareEncrypted;
        bytes shareEncryptedHash;  
        uint40 delay; 
        uint40 request;
        uint8 disabled;     
    }
    
    struct Backup {
        address owner;
        uint8 disabled;       
        uint8 treshold; 
        bytes commentEncrypted;
        Share[] shares;
    }
   
    /// @notice Maps a string tag to a Backup.
    /// @dev The tag is a user-defined identifier for the backup.
    mapping(string => Backup) public backups;    
    mapping(address => string[]) public userTags;   
    string[] public allTags; 

    mapping(address => mapping(bytes32 => bool)) public nonces;  

    constructor(IEventEmitter _eventEmitter) { 
        eventEmitter = _eventEmitter;

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256("BuckitUpVault"), 
                keccak256("1"), // Version
                block.chainid, 
                address(this) 
            )
        );
    }
        
    function addBackup(string calldata tag, Backup calldata backup, uint40 expire, bytes calldata signature) external notExpired(expire) {
        require(backups[tag].owner == address(0), "Tag already exists");   
        
        uint256 portionsLength = backup.shares.length;
        require(portionsLength > 0 && portionsLength < type(uint8).max, "Bad shares length");      
        require(backup.treshold <= portionsLength, "Bag treshold"); 
        
        for (uint8 i = 0; i < portionsLength; i++) {
            for (uint8 j = i + 1; j < portionsLength; j++) {
                require(backup.shares[i].stealthAddress != backup.shares[j].stealthAddress, "Address duplicate");                 
            }
        }

        bytes memory PORTIONS_ARRAY_HASH;
        for (uint256 i = 0; i < backup.shares.length; i++) {
            Share memory share = backup.shares[i];
            PORTIONS_ARRAY_HASH = bytes.concat(PORTIONS_ARRAY_HASH, keccak256(
                abi.encode(
                    SHARE_TYPEHASH,
                    share.stealthAddress,
                    keccak256(share.messageEncrypted),
                    keccak256(share.ephemeralPubKey),
                    keccak256(share.shareEncrypted),
                    keccak256(share.shareEncryptedHash),
                    share.delay,
                    share.request,
                    share.disabled
                )
            ));
        }

        bytes32 structHash = keccak256(
            abi.encode(
                ADD_BACKUP_TYPEHASH,
                keccak256(bytes(tag)),
                keccak256(abi.encode(
                    BACKUP_TYPEHASH,
                    backup.owner,
                    backup.disabled,    
                    backup.treshold,                     
                    keccak256(backup.commentEncrypted),
                    keccak256(PORTIONS_ARRAY_HASH)
                )),    
                expire                
            )
        );
        
        address owner = _recoverSigner(structHash, signature);       
        require(backup.owner == owner, "Bag owner signature");   
        
        backups[tag] = backup;
        userTags[owner].push(tag);        
        allTags.push(tag);

        eventEmitter.emitEvent("addBackup", abi.encode(tag));            
    }

    function updateBackupDisabled(string calldata tag, uint8 disabled, uint40 expire, bytes calldata signature) external notExpired(expire) {
        Backup storage backup = backups[tag];
                
        bytes32 structHash = keccak256(
            abi.encode(
                UPDATE_BACKUP_DISABLED_TYPEHASH,
                keccak256(bytes(tag)),
                disabled, 
                expire                
            )
        );
        
        address owner = _recoverSigner(structHash, signature);     
        require(backup.owner == owner, "Bag owner signature");

        require(backup.disabled != disabled, "Nothing to change");
        
        backup.disabled = disabled;
        eventEmitter.emitEvent("updateBackupDisabled", abi.encode(tag, disabled));                 
    }

    function updateShareDisabled(string calldata tag, uint8 idx, uint8 disabled, uint40 expire, bytes calldata signature) external notExpired(expire) {
        Backup storage backup = backups[tag];
                
        bytes32 structHash = keccak256(
            abi.encode(
                UPDATE_SHARE_DISABLED_TYPEHASH,
                keccak256(bytes(tag)),
                idx,
                disabled, 
                expire                
            )
        );
        
        address owner = _recoverSigner(structHash, signature);     
        require(backup.owner == owner, "Bag owner signature");

        require(idx < backup.shares.length, "Wrond idx");

        Share storage share = backup.shares[idx];
        
        require(share.disabled != disabled, "Nothing to change");        
        share.disabled = disabled;                  
        
        eventEmitter.emitEvent("updateShareDisabled", abi.encode(tag, idx, disabled));              
    }

    function updateShareDelay(string calldata tag, uint8 idx, uint40 delay, uint40 expire, bytes calldata signature) external notExpired(expire) {
        Backup storage backup = backups[tag];
                
        bytes32 structHash = keccak256(
            abi.encode(
                UPDATE_SHARE_DELAY_TYPEHASH,
                keccak256(bytes(tag)),
                idx,
                delay,                
                expire                
            )
        );
        
        address owner = _recoverSigner(structHash, signature);     
        require(backup.owner == owner, "Bag owner signature");

        require(idx < backup.shares.length, "Wrond idx");

        Share storage share = backup.shares[idx];
        
        require(share.delay != delay, "Nothing to change");
        share.delay = delay;
                        
        eventEmitter.emitEvent("updateShareDelay", abi.encode(tag, idx, delay));              
    }

    function requestRecover(string calldata tag, uint8 idx, uint40 expire, bytes calldata signature) external notExpired(expire) {
        Backup storage backup = backups[tag];        
        require(backup.owner != address(0), "Tag not exists");   

        require(backup.shares.length > idx, "Share not exists");             
        Share storage share = backup.shares[idx];                 
                   
        bytes32 structHash = keccak256(
            abi.encode(
                REQUEST_RECOVER_TYPEHASH,
                keccak256(bytes(tag)),
                idx,
                expire
            )
        );
        
        address stealthAddress = _recoverSigner(structHash, signature);        
        require(stealthAddress == share.stealthAddress, "Not valid address signature"); 

        require(share.request == 0, "Already requested");
        share.request = uint40(block.timestamp);
        
        eventEmitter.emitEvent("requestRecover", abi.encode(tag, idx)); 
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

    function granted(string calldata tag, uint8 idx, address stealthAddress) external view returns (bool){
        Backup memory backup = backups[tag];
        
        if (backup.owner == address(0)) return false;
        if (backup.disabled == 1) return false;

        Share memory share = backup.shares[idx];  
       
        if (share.stealthAddress == stealthAddress) {
            if (share.disabled == 1) return false; // if owner disabled address
            if (share.delay == 0) return true; // if no delay is set             
            if (share.request == 0) return false; // if request not made
            if (share.request + share.delay > block.timestamp) return false; // if time not past
            return true;
        }
        return false;
    }

    /// @notice Fetches a backup from the vault based on its tag.
    /// @param tag The user-defined tag identifying the desired backup.
    /// @return Returns the Backup struct associated with the given tag.
    function getBackup(string memory tag) public view returns(Backup memory) {
        return backups[tag];
    }

    function getBackups(string[] memory tags) public view returns(Backup[] memory) {
        Backup[] memory list  = new Backup[](tags.length);
        for (uint256 index = 0; index < tags.length; index++) {
            list[index] = backups[tags[index]];
        }
        return list;
    }
    
    function getTags(address owner) public view returns(string[] memory) {
        if (owner == address(0)) {
            return allTags;
        } else {
            return userTags[owner];
        }        
    }   
}
