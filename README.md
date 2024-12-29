# Passkey Demo

Demo Link: [https://passkey.appdev.pp.ua/register](https://passkey.appdev.pp.ua/register)

## Repository Structure

This repository contains three main packages:

1. **Bc** - Smart Contracts  
2. **App** - Vue.js Client  
3. **Api** - Server-side Backend  

---

## Setup Instructions

### **1. Smart Contracts (Bc)**

#### Description:
The `Bc` package contains the smart contracts and deployment scripts. Local and Sepolia chains are supported. Deployment to Sepolia requires a private key in the `.env` file.

#### Steps to Deploy:

1. Navigate to the `/bc` folder:
   ```bash
   cd /bc
   ```

2. Install dependencies:
   ```bash
   npm i
   ```

3. Deploy the contracts:
   - For the **local** chain:
     ```bash
     npx hardhat run --network local scripts/deploy.js
     ```
   - For the **Sepolia** chain:
     ```bash
     npx hardhat run --network sepolia scripts/deploy.js
     ```

4. After deployment, the script generates a `bcConfig` file with the contract setup required for the **App** and **API**.

---

### **2. API**

#### Description:
The `Api` package provides the backend server functionality.

#### Steps to Set Up:

1. Configure the `.env` file with the required environment variables.

2. Navigate to the `/api` folder:
   ```bash
   cd /api
   ```

3. Install dependencies:
   ```bash
   npm i
   ```

4. Start the server:
   - For development:
     ```bash
     npm run dev
     ```
   - For production:
     ```bash
     npm run start
     ```

---

### **3. Vue.js Client (App)**

#### Description:
The `App` package contains the frontend code for the demo, built with Vue.js.

#### Steps to Set Up:

1. Navigate to the `/app` folder:
   ```bash
   cd /app
   ```

2. Install dependencies:
   ```bash
   npm i
   ```

3. Run the app:
   - For development:
     ```bash
     npm run dev
     ```
   - To build for production:
     ```bash
     npm run build
     ```

---

## Summary

1. **Deploy Smart Contracts**:
   - Use the deployment script to deploy contracts on the desired chain (local or Sepolia).
   - A `bcConfig` file will be generated for use in the App and API.

2. **Set Up API**:
   - Configure the `.env` file and start the backend server.

3. **Run or Build the App**:
   - Run the Vue.js client in development or production mode.

---
