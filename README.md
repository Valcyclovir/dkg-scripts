# DKG Scripts

This repository contains a collection of Node.js scripts for interacting with the OriginTrail Decentralized Knowledge Graph (DKG) using the `dkg.js` library. The scripts enable creating, managing, and querying knowledge assets and Paranets, as well as leveraging AI (Google Gemini) for generating structured JSON-LD data and SPARQL queries. These tools are designed for developers working with decentralized knowledge graphs and blockchain-based data ecosystems.

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Scripts Overview](#scripts-overview)
- [Usage Examples](#usage-examples)
- [Assets](#assets)
- [Contributing](#contributing)
- [License](#license)
- [Notes](#notes)

---

## Features

- Create knowledge assets on the OriginTrail DKG with customizable configurations.
- Submit assets to Paranets for collaborative knowledge sharing.
- Convert text to structured JSON-LD using Google Gemini AI.
- Create and modify Paranets with flexible access policies.
- Query DKG and Paranet data using SPARQL, including AI-generated queries.
- Retrieve asset and Paranet metadata by Universal Asset Locator (UAL).

---

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- An OriginTrail DKG node (testnet or mainnet) accessible via endpoint
- A blockchain wallet with a private key (e.g., for Base, Gnosis, or Neuroweb)
- A Google Gemini API key for scripts utilizing AI features (`createAssetSubmitParanetLlm.js`, `sparql-query-llm.js`)

---

## Installation

Clone the repository:

```bash
git clone https://github.com/your-username/dkg-scripts.git
cd dkg-scripts
```

Install dependencies:

```bash
npm install
```

---

## Configuration

Create a `.env` file in the root directory based on the provided `.env.example` or use the following template:

```env
# DKG node connection details
OTNODE_HOST=https://v6-pegasus-node-02.origin-trail.network/
OTNODE_PORT=8900
USE_SSL=true

# Wallet details
PRIVATE_KEY=your_private_key
BLOCKCHAIN_NAME=base:84532
# Values: (mainnet) "base:8453", "gnosis:100", "otp:2043" (testnet) "base:84532", "gnosis:10200", "otp:20430"

# Paranet UAL (optional, required for Paranet-related scripts)
PARANET_UAL=

# Profile knowledge asset configuration
PROFILE_UAL=""
PROFILE_NAME=""
EPOCHS_NUM=12
MAX_NUMBER_OF_RETRIES=30
FREQUENCY=2
CONTENT_TYPE="all"

# Paranet configuration
PARANET_NAME="dkg-script"
PARANET_DESCRIPTION="a collection of Node.js scripts for interacting with the OriginTrail Decentralized Knowledge Graph"
PARANET_NODES_ACCESS_POLICY=0 #OPEN:0 PERMISSIONED: 1
PARANET_MINERS_ACCESS_POLICY=0 #OPEN:0 PERMISSIONED: 1
PARANET_KC_SUBMISSION_POLICY=0 #OPEN:0 STAGING: 1

# Google Gemini API key (for LLM scripts)
GEMINI_API_KEY=your_gemini_api_key # Get a key here: https://ai.google.dev/gemini-api/docs/api-key

# Assets directory (optional, defaults to 'assets')
ASSETS_DIR=assets
```

Replace placeholders (e.g., `your_private_key`, `your_gemini_api_key`) with your actual credentials. Ensure the assets folder exists if using scripts that process files (`createAssetSubmitParanet.js`, `createAssetSubmitParanetLlm.js`).

---

## Scripts Overview

| Script                        | Description                                                                                      |
|-------------------------------|--------------------------------------------------------------------------------------------------|
| `createAsset.js`              | Creates a single knowledge asset (Dataset schema) on the DKG using parameters from the `.env`.   |
| `createAssetSubmitParanet.js` | Processes multiple JSON/JSON-LD files from the assets directory, creates assets, and optionally submits them to a Paranet. |
| `createAssetSubmitParanetLlm.js` | Converts `.txt` files to JSON-LD using Google Gemini AI, creates assets, and submits them to a Paranet if configured. |
| `createParanet.js`            | Creates a Paranet using a profile knowledge asset or an existing UAL, with customizable access policies. |
| `getUalInfo.js`               | Retrieves metadata for a specified Paranet or asset using its UAL.                               |
| `modifyParanet.js`            | Modifies an existing Paranet’s policies using a profile UAL.                                     |
| `sparqlQuery.js`              | Executes a predefined SPARQL query to retrieve Dataset assets from the DKG.                      |
| `sparql-query-llm.js`         | Generates and executes a SPARQL query using Google Gemini AI based on a user-defined query string.|
| `sparqlQueryParanet.js`       | Executes a SPARQL query to retrieve Event assets from a specified Paranet.                       |
| `ualToParanet.js`             | Creates a Paranet from an existing profile UAL with predefined settings for the "DKG Swarm Paranet". |

---

## Usage Examples

**Create a Knowledge Asset:**
```bash
node createAsset.js
```
_Creates a test dataset asset and outputs its UAL._

**Process and Submit Assets to a Paranet:**
```bash
node createAssetSubmitParanet.js
```
_Processes all `.json` and `.jsonld` files in the assets directory, creates assets, and submits them to the Paranet specified in `PARANET_UAL`._

**Convert Text to JSON-LD and Publish:**
```bash
node createAssetSubmitParanetLlm.js
```
_Converts `.txt` files in the assets directory to JSON-LD using Gemini AI, creates assets, and submits them to a Paranet._

**Create a Paranet:**
```bash
node createParanet.js
```
_Creates a Paranet with the configuration defined in the `.env` file._

**Query Paranet Data:**
```bash
node sparqlQueryParanet.js
```
_Retrieves Event assets from the Paranet specified in `PARANET_UAL`._

---

## Assets

The `assets` folder contains example files:

- `asset0.jsonld`: A sample SocialMediaPosting asset describing a deep fake celebrity video.
- `asset1.txt`: A text description of a suspicious cryptocurrency endorsement, used by `createAssetSubmitParanetLlm.js` to generate JSON-LD.

Ensure the `ASSETS_DIR` in `.env` points to the correct folder (defaults to `assets`).

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m 'Add your feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

---

## License

This project is licensed under the ISC License. See the `package.json` for details.

---

## Notes

- The README assumes the repository is hosted on GitHub; update the clone URL with your actual repository URL.
- The `.env` example includes sensitive fields like `PRIVATE_KEY` and `GEMINI_API_KEY`. In a real README, you might want to emphasize securing these values and not committing the `.env` file.
- The scripts rely on environment variables, so the README emphasizes proper `.env` configuration.
- The assets section briefly describes the provided files to give users context for testing.

If you have additional details (e.g., specific blockchain networks, Paranet use cases, or project goals), let me know, and I can refine the README further!