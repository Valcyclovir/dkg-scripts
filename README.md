# DKG-scripts

A collection of scripts and utilities for creating, managing, and querying OriginTrail DKG (Decentralized Knowledge Graph) assets and paranets. This toolkit helps you automate asset creation, paranet management, and SPARQL queries on the OriginTrail network.

## Features

- **Create and manage paranets** on the OriginTrail DKG
- **Publish knowledge assets** (e.g., datasets, events) to the DKG
- **Submit assets to a paranet**
- **Query the DKG** using SPARQL
- **Modify paranet policies**
- **Fetch and inspect asset/paranet information**

## Prerequisites

- Node.js (v16+ recommended)
- Access to an OriginTrail node (OTNode)
- Blockchain credentials (private/public key, network info)

## Installation

```bash
git clone <this-repo>
cd dkg-scripts
npm install
```

## Environment Setup

Create a `.env` file in the project root (see below for required variables):

```bash
cp .env.example .env
# Edit .env and fill in your configuration
```

**Required .env variables:**

| Variable                       | Description                                      |
|--------------------------------|--------------------------------------------------|
| OTNODE_HOST                    | OTNode API host (e.g., http://localhost)         |
| OTNODE_PORT                    | OTNode API port (e.g., 8900)                     |
| BLOCKCHAIN_NAME                | Blockchain network name (e.g., otp:2043)         |
| PRIVATE_KEY                    | Blockchain private key                           |
| PUBLIC_KEY                     | Blockchain public key                            |
| ENVIRONMENT                    | DKG environment (e.g., testnet, development)     |
| EPOCHS_NUM                     | Number of epochs for asset publishing            |
| MAX_NUMBER_OF_RETRIES          | Max retries for DKG operations                   |
| FREQUENCY                      | Frequency for DKG polling                        |
| CONTENT_TYPE                   | Content type for assets (e.g., application/json) |
| PARANET_NAME                   | Name for your paranet                            |
| PARANET_DESCRIPTION            | Description for your paranet                     |
| PARANET_NODES_ACCESS_POLICY    | Paranet nodes access policy (integer)            |
| PARANET_MINERS_ACCESS_POLICY   | Paranet miners access policy (integer)           |
| PARANET_KC_SUBMISSION_POLICY   | Paranet KC submission policy (integer)           |
| PARANET_UAL                    | (Optional) Existing Paranet UAL                  |
| PROFILE_NAME                   | (Optional) Name for profile knowledge asset      |
| ASSET_NAME                     | (Optional) Name for asset creation               |
| ASSETS_DIR                     | (Optional) Directory for asset files (default: assets) |

> **Note:** The `.env` file is ignored by git.

## Usage

### 1. Create a Paranet

Creates a new paranet or uses an existing one if `PARANET_UAL` is set.

```bash
node create-paranet.js
```

### 2. Create a Knowledge Asset

Publishes a new knowledge asset to the DKG.

```bash
node create-asset.js
```

### 3. Create and Submit Assets to Paranet

Publishes all JSON/JSON-LD assets in the `assets/` directory and submits them to the paranet if `PARANET_UAL` is set.

```bash
node create-asset-submit-paranet.js
```

### 4. Create Paranet from Existing UAL

Creates a paranet using an existing profile knowledge asset UAL.

```bash
node ual-to-paranet.js
```

### 5. Modify Paranet Policy

Updates the access/submission policies of an existing paranet.

```bash
node modify-paranet.js
```

### 6. Query the DKG

Runs a sample SPARQL query to list assets of type `schema:Event`.

```bash
node query.js
```

### 7. Simple SPARQL Query

Runs a simple SPARQL query for `schema:DataCatalog` assets.

```bash
node simpleSparqlQuery.js
```

### 8. Get Paranet/Asset Info

Fetches and prints information about a paranet or asset by UAL.

```bash
node get-ual-info.js
```

## Example Asset File

Place your asset files in the `assets/` directory. Example (`assets/asset1.jsonld`):

```json
{
  "public": {
    "@context": "http://schema.org",
    "@type": "Event",
    "name": "DeepFakeCelebrityVideo",
    "description": "A viral video shows a celebrity endorsing a suspicious product. Is it real or a deep fake?",
    "isReal": false,
    "image": "https://yourdomain.com/game/media/event1.jpg",
    "eventType": "question",
    "keywords": ["deepFake", "misinformation", "video"],
    "creator": {
      "@type": "Organization",
      "name": "Swarm of Truth"
    },
    "datePublished": "2025-05-13T22:55:00Z",
    "license": "https://creativecommons.org/licenses/by/4.0/"
  }
}
```

## Notes

- All scripts require a properly configured `.env` file.
- For more details on each script, read the comments at the top of each `.js` file.
- The `node_modules/` and `.env` files are git-ignored.
