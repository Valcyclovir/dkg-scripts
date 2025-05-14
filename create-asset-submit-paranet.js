const DKGClient = require("dkg.js");
require("dotenv").config();
const fs = require('fs');
const path = require('path');

const node_options = {
  endpoint: process.env.OTNODE_HOST,
  port: process.env.OTNODE_PORT,
  blockchain: {
    name: process.env.BLOCKCHAIN_NAME,
    privateKey: process.env.PRIVATE_KEY,
  },
  useSSL: true,
  maxNumberOfRetries: 100,
  frequency: 2,
};

const dkg = new DKGClient(node_options);

async function checkNodeConnection() {
  try {
    const nodeInfo = await dkg.node.info();
    console.log("Connected to node:", nodeInfo);
  } catch (error) {
    throw new Error("Node connection failed: " + error.message);
  }
}

// Get assets directory from .env or default to 'assets'
const assetsDir = process.env.ASSETS_DIR || 'assets';

async function processAssets() {
  let assetFiles;
  try {
    assetFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.jsonld') || f.endsWith('.json'));
    if (assetFiles.length === 0) {
      console.log(`No asset files found in directory: ${assetsDir}`);
      return;
    }
  } catch (err) {
    console.error(`Failed to read assets directory: ${assetsDir}`, err);
    return;
  }

  for (const file of assetFiles) {
    const filePath = path.join(assetsDir, file);
    let assetContent;
    try {
      assetContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.error(`Failed to parse asset file: ${filePath}`, err);
      continue;
    }
    console.log(`\nProcessing asset file: ${file}`);
    try {
      await checkNodeConnection();
      const assetOptions = {
        epochsNum: parseInt(process.env.EPOCHS_NUM),
        maxNumberOfRetries: parseInt(process.env.MAX_NUMBER_OF_RETRIES),
        frequency: parseInt(process.env.FREQUENCY),
        contentType: process.env.CONTENT_TYPE,
        blockchain: {
          name: process.env.BLOCKCHAIN_NAME,
          privateKey: process.env.PRIVATE_KEY,
        },
      };
      const asset = await dkg.asset.create(assetContent, assetOptions);
      console.log('Knowledge Asset Created:', JSON.stringify(asset, null, 2));
      console.log('Asset UAL:', asset.UAL);
      if (process.env.PARANET_UAL) {
        try {
          const submitResult = await dkg.asset.submitToParanet(asset.UAL, process.env.PARANET_UAL);
          console.log('Asset Submitted to Paranet:', JSON.stringify(submitResult, null, 2));
        } catch (submitError) {
          console.error('Failed to submit asset to Paranet:', submitError.message);
        }
      } else {
        console.log('PARANET_UAL not specified, skipping Paranet submission.');
      }
    } catch (error) {
      console.error('Error during asset creation for file', file, error);
    }
  }
}

// Execute the function
(async () => {
  await processAssets();
})();
