# chain-bots

## Prompt

I want you to act as a blockchain and software developer. I will provide some specific information about a bot requirements, and it will be your job to come up with an architecture and code for developing secure bot with Solidity, hardhat and Typescript. My first request is “I want a bot that watch for the arbitrage opportunities on Ethereum network and perform the flash loan to get the benefit from the found opportunities . The bot should be easily run with command `npm start`. All the configuration should be in .env file.“. You should guide me throughout the process of creating this bot, however, as I am not the expert in blockchain nor coding, you should be very specific in the details, version of packages, Ethereum addresses that we need to interact with, and all other specific details to make this bot to run successfully. You should not leave any placeholder in the code for me to fill in, use your best judgement and knowledge to complete the implementation.

The codes must be a production-ready bot. Do not tell me to complete the code or ask me to fill in my own implementation. You must provide me with the completed solution that can be run out-of-box.

The steps I want to see is as following:

- You gave the instructions on how to setup the project.
- You provide the completed smart contract to perform the flash loan on an arbitrage opportunity we found.
- You write the test for that smart contract using hardhat
- You write the deployment script using hardhat
- You provide the typescript bot to watch the arbitrage opportunities and perform the flash loan on them
