Demo: https://passkey.appdev.pp.ua/register

This repo contains 3 packages:

Bc - contracts

App - vue client 

Api - server side

------------------------- Start with contracts ----------------------------

In this demo local and sepolia chain could be used.
Deployment to sepolia required private key in .env file

cd to /bc folder

npm i

Use deploy script for required chain.

npx hardhat run --network local scripts/deploy.js

or 

npx hardhat run --network sepolia scripts/deploy.js

After deployment script will generate bcConfig file with contracts setup required for app and api.

------------------------- Api ----------------------------

Configure .env file

cd to /api folder

npm i

npm run dev 

or

npm run start

------------------------- App ----------------------------

cd to /app folder

npm i

npm run dev 

or

npm run build