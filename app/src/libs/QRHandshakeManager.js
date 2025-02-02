import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import { utils } from 'ethers';
import * as $enigma from './enigma';

export default class QRHandshakeManager extends EventTarget {
    constructor(container, account, options) {
        super();
        this.account = account;
        this.container = container;
        this.options = options;
        this.scanning = false;
        this.state = {
            challenge: null,
            signature: null,
            verified: 0,
            completed: false,
            contactChallenge: null,
            contactAddress: null,
            contactPublicKey: null,
            contactName: null,
            contactVerified: 0,
        };
    
        this.staticString = 'BKP';
        this.qrCode = null;
        this.qrScanner = null;    
        this.init();
    }
    
    async init() {
      this.container.innerHTML = this.getTemplate();
      this.qrCode = this.container.querySelector("#qrCode")
      this.qrCodeWrapper = this.container.querySelector("._qrh_wrapper")      
    }
  
    getTemplate() {
      return `
        <div class="_qrh">
          <div class="_qrh_wrapper" id="qrCodeWrapper" style="display: none;">
            <div class="_qrh_container"> 
                <canvas id="qrCode"></canvas>
            </div>
          </div>               
          <div id="qrScanner" style="width: 0; height: 0; opacity: 0;"></div>
        </div>
      `;
    }
     
    emitEvent(eventName, detail = {}) {  
        this.dispatchEvent(
            new CustomEvent(eventName, { detail })
        )
    }
  
    generateChallenge() {
        const staticBytes = utils.toUtf8Bytes(this.staticString); // Convert 'buckitup' to bytes
        const randomBytes = utils.randomBytes(10); // Generate 16 random bytes
        this.state.challenge = utils.base58.encode(Buffer.concat([staticBytes, randomBytes])) // .toString('base58') 
    }
  
    async updateQr() {
        if (this.qrCode && this.state.challenge) {   
            if (this.state.contactChallenge && !this.state.signature) {   
                this.state.signature = $enigma.signChallenge(this.state.contactChallenge + this.account.name, this.account.privateKeyB64)            
                this.qrCodeWrapper.classList.add('_qrh_detected'); // Show
                if ("vibrate" in navigator) navigator.vibrate([50]);                  
            }
    
            const displayName = this.state.signature ? utils.base58.encode(new TextEncoder().encode(this.account.name)) : ''
              
            const msg = `${this.state.verified}${this.state.challenge}${this.state.signature || ''}${displayName}`      
    
            console.log('msg1', msg, this.state.verified, this.state.challenge, this.state.signature, displayName)
            
            QRCode.toCanvas(this.qrCode, msg);
            
            if (this.state.verified && this.state.contactVerified && !this.state.completed) {
                this.state.completed = true
                this.dispose();   
                this.qrCodeWrapper.classList.add('_qrh_verified');
                // Emit the completed event with relevant data
                this.emitEvent('handshakeCompleted', {
                    address: this.state.contactAddress,
                    publicKey: this.state.contactPublicKey,
                    name: this.state.contactName
                });
                
                if ("vibrate" in navigator) navigator.vibrate([500, 100, 500, 100, 500]);
                
                await this.wait(3000)
                this.scanning = false
                this.container.querySelector('#qrCodeWrapper').style.display = 'none'
                this.emitEvent('scanning', this.scanning);
            }        
        }
    }
  
    toggleScanner() {
        if (this.scanning && this.qrScanner) {
            this.dispose();
            this.scanning = false
            this.container.querySelector('#qrCodeWrapper').style.display = 'none'
            this.emitEvent('scanning', this.scanning);
            this.updateQr()
            return
        }
        this.reset()
        this.generateChallenge()
        this.scanning = true
        this.container.querySelector('#qrCodeWrapper').style.display = 'flex'
        this.emitEvent('scanning', this.scanning);
        this.updateQr()

        try {
            this.qrScanner = new Html5Qrcode("qrScanner");
            this.qrScanner.start(
                { facingMode: "user" },
                { fps: 20, aspectRatio: 1.0, qrbox: { width: 370, height: 370 } },
                async (msg) => {            
                    try {
                        // Extract the fixed parts based on known lengths
                        const verified = parseInt(msg[0]); // First character (1 char)
                        const challenge = msg.slice(1, 19); // Next 18 characters (2nd to 19th char)
                        const signature = msg.length > 19 ? msg.slice(19, 107) : null; // 19th to 107th char (if present)
                        const displayNameEnc = msg.length > 107 ? msg.slice(107) : null;
                        
                        console.log('msg2', msg, verified, challenge, signature, displayNameEnc)
                
                        if (challenge) {
                            const decodedChallengeBytes = utils.base58.decode(challenge);                
                            const contactChallengeDec = new TextDecoder().decode(decodedChallengeBytes);  
                
                            if (challenge && contactChallengeDec.startsWith(this.staticString)) {
                                if (this.state.contactChallenge !== challenge) {
                                    if (this.state.contactChallenge) {
                                        this.reset()
                                    }
                                    this.state.contactChallenge = challenge; 
                                }
                
                                if (signature) {        
                                    const decodedNameBytes = utils.base58.decode(displayNameEnc);
                                    const displayName = new TextDecoder().decode(decodedNameBytes);
                
                                    const publicKeyCompact = $enigma.recoverPublicKey(this.state.challenge + displayName, signature)
                                    const publicKey = utils.computePublicKey('0x' + $enigma.convertPublicKeyToHex(publicKeyCompact))
                                    
                                    this.state.contactAddress = utils.computeAddress(publicKey)  
                                    this.state.contactPublicKey = publicKeyCompact                                     
                                    this.state.contactDisplayName = displayName
                                    this.state.verified = 1
                                    
                                    this.state.contactVerified = verified
                                    
                                }  
                                this.updateQr()              
                            }
                        }
                    } catch (error) {
                        console.log('readQr error', error)        
                    }
                },
                (errorMessage) => {
                    if (!errorMessage.includes('QR code parse error')) {
                        console.error("Scanning error:", errorMessage);
                    }
                }
            );
        } catch (error) {
            console.error("Init Scanning error:", error);
        }
    }

    dispose() {
        try {
            this.qrScanner.stop(); 
        } catch (error) {
            console.log(error)
        }
    }
  
    reset() {
        this.state.verified = 0
        this.state.completed = 0
        this.state.signature = null
        this.state.contactChallenge = null    
        this.state.contactAddress = null
        this.state.contactPublicKey = null
        this.state.contactDisplayName = null
        this.state.contactVerified = 0
    }

    wait(delay = 500) {
        return new Promise((resolve) =>
            setTimeout(() => {
                resolve();
            }, delay)
        );
    }
  }
  
  