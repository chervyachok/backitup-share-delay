// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";

/// @title Vault contract for storing backup information.
contract BuckitUpVault {

    /// @notice The structure defining a backup.
    /// @dev The backup contains the owner's address, a list of stealth addresses, the ephemeral public key used to generate the address and the SSSPortions.
    
    struct Portion {        
        address stealthAddress;
        bytes ephemeralPubKey;
        bytes share;
        bytes shareEncryptHash;  
        uint40 delay; 
        uint40 request;
        uint8 disabled;     
    }
    
    struct Backup {
        address owner;
        uint8 disabled;       
        uint8 treshold; 
        Portion[] portions;
    }
   
    /// @notice Maps a string tag to a Backup.
    /// @dev The tag is a user-defined identifier for the backup.
    mapping(string => Backup) public backups;    
    mapping(address => string[]) public userTags;   
    string[] public allTags; 

    mapping(address => mapping(uint256 => bool)) public nonces;  

    // EIP-712 Domain Separator
    bytes32 public DOMAIN_SEPARATOR;
    bytes32 public constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 public constant PORTION_TYPEHASH = keccak256(
        "Portion(address stealthAddress,bytes ephemeralPubKey,bytes share,bytes shareEncryptHash,uint40 delay,uint40 request,uint8 disabled)"
    ); 
    bytes32 public constant BACKUP_TYPEHASH = keccak256(
        "Backup(address owner,uint8 disabled,uint8 treshold,Portion[] portions)Portion(address stealthAddress,bytes ephemeralPubKey,bytes share,bytes shareEncryptHash,uint40 delay,uint40 request,uint8 disabled)"
    );
    bytes32 public constant ADD_BACKUP_TYPEHASH = keccak256(
        "AddBackup(string tag,Backup backup,uint40 deadline,uint40 nonce)Backup(address owner,uint8 disabled,uint8 treshold,Portion[] portions)Portion(address stealthAddress,bytes ephemeralPubKey,bytes share,bytes shareEncryptHash,uint40 delay,uint40 request,uint8 disabled)"
    );
    bytes32 public constant UPDATE_BACKUP_TYPEHASH = keccak256(
        "UpdateBackup(string tag,uint8 disabled,uint8 idx,uint40 delay,uint8 disabledIdx,uint40 deadline,uint40 nonce)"
    );      
    bytes32 public constant RESTORE_BACKUP_TYPEHASH = keccak256(
        "RestoreBackup(string tag,uint8 idx,uint40 deadline,uint40 nonce)"
    );   

    constructor() { 
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256("BuckitUpVault"), // Contract name
                keccak256("1"), // Version
                block.chainid, // Chain ID
                address(this) // Contract address
            )
        );
    }
        
    function addBackup(string calldata tag, Backup calldata backup, uint40 deadline, uint40 nonce, bytes calldata signature) external {
        require(backups[tag].owner == address(0), "Tag already exists");   
        
        uint256 portionsLength = backup.portions.length;
        require(portionsLength > 0 && portionsLength < type(uint8).max, "Bad portions length");      
        require(backup.treshold <= portionsLength, "Bag treshold"); 
        
        for (uint8 i = 0; i < portionsLength; i++) {
            for (uint8 j = i + 1; j < portionsLength; j++) {
                require(backup.portions[i].stealthAddress != backup.portions[j].stealthAddress, "Address duplicate");                 
            }
        }

        bytes memory PORTIONS_ARRAY_HASH;
        for (uint256 i = 0; i < backup.portions.length; i++) {
            PORTIONS_ARRAY_HASH = bytes.concat(PORTIONS_ARRAY_HASH, keccak256(
                abi.encode(
                    PORTION_TYPEHASH,
                    backup.portions[i].stealthAddress,
                    keccak256(backup.portions[i].ephemeralPubKey),
                    keccak256(backup.portions[i].share),
                    keccak256(backup.portions[i].shareEncryptHash),
                    backup.portions[i].delay,
                    backup.portions[i].request,
                    backup.portions[i].disabled
                )
            ));
        }

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01", 
                DOMAIN_SEPARATOR, 
                keccak256(abi.encode(
                    ADD_BACKUP_TYPEHASH,
                    keccak256(bytes(tag)),
                    keccak256(abi.encode(
                        BACKUP_TYPEHASH,
                        backup.owner,
                        backup.disabled,    
                        backup.treshold, 
                        keccak256(PORTIONS_ARRAY_HASH)
                    )),    
                    deadline,
                    nonce
                ))
            )
        );
        
        address owner = ECDSA.recover(digest, signature);     
        require(backup.owner == owner, "Bag owner signature");    

        require(!nonces[owner][nonce], "Nonce used");
        nonces[owner][nonce] = true;
        
        backups[tag] = backup;
        userTags[owner].push(tag);        
        allTags.push(tag);

        emit AddBackup(backup.owner, tag);
    }

    function updateBackup(string calldata tag, uint8 disabled, uint8 idx, uint40 delay, uint8 disabledIdx, uint40 deadline, uint40 nonce, bytes calldata signature) external {
        Backup storage backup = backups[tag];
                
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01", 
                DOMAIN_SEPARATOR, 
                keccak256(abi.encode(
                    UPDATE_BACKUP_TYPEHASH,
                    keccak256(bytes(tag)),
                    disabled,   
                    idx,
                    delay,
                    disabledIdx, 
                    deadline,
                    nonce
                ))
            )
        );
        
        address owner = ECDSA.recover(digest, signature);     

        require(backup.owner == owner, "Bag owner signature");

        require(!nonces[owner][nonce], "Nonce used");
        nonces[owner][nonce] = true;

        if (backup.disabled != disabled) {
            backup.disabled = disabled;
        }

        if (idx < backup.portions.length) {
            Portion storage portion = backup.portions[idx];
            if (portion.delay != delay) {
                portion.delay = delay;
            }
            if (portion.disabled != disabledIdx) {
                portion.disabled = disabledIdx;
            }
        }  
        emit UpdateBackup(backup.owner, tag);         
    }

    function requestRestore(string calldata tag, uint8 idx, uint40 deadline, uint40 nonce, bytes calldata signature) external {
        Backup storage backup = backups[tag];
        
        require(backup.owner != address(0), "Tag not exists");   
        require(backup.disabled == 0, "Restore disabled");   

        Portion storage portion = backup.portions[idx]; 
        require(portion.disabled == 0, "Share disabled");
          
        require(deadline > block.timestamp, "Expired");

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01", 
                DOMAIN_SEPARATOR, 
                keccak256(abi.encode(
                    RESTORE_BACKUP_TYPEHASH,
                    keccak256(bytes(tag)),
                    idx,
                    deadline,
                    nonce
                ))
            )
        );
        
        address stealthAddress = ECDSA.recover(digest, signature);
        require(stealthAddress == portion.stealthAddress, "Not valid address signature"); 

        require(!nonces[stealthAddress][nonce], "Nonce used");
        nonces[stealthAddress][nonce] = true;
                   
        portion.request = uint40(block.timestamp);
        
        emit RequestRestore(backup.owner, tag, stealthAddress);        
    }

    function granted(string calldata tag, uint8 idx, address stealthAddress) external view returns (bool){
        Backup memory backup = backups[tag];
        
        if (backup.owner == address(0)) return false;
        if (backup.disabled == 1) return false;

        Portion memory portion = backup.portions[idx];  
       
        if (portion.stealthAddress == stealthAddress) {
            if (portion.disabled == 1) return false; // if owner disabled address
            if (portion.delay == 0) return true; // if no delay is set             
            if (portion.request == 0) return false; // if request not made
            if (portion.request + portion.delay > block.timestamp) return false; // if time not past
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
    
    event RequestRestore(address indexed owner, string tag, address stealthAddress);
    event UpdateBackup(address indexed owner, string tag);
    event AddBackup(address indexed owner, string tag);
}
