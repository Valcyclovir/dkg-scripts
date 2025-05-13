const DKGClient = require("dkg.js");
require("dotenv").config();

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

async function createAsset() {
  try {
    // Step 1: Verify node connection
    await checkNodeConnection();

    // Step 2: Define the knowledge asset content with Dataset schema
    const assetContent = {
      public: {
        "@context": "http://schema.org",
        "@type": "Dataset",
        name: process.env.ASSET_NAME || "Test Dataset",
        description: "A test dataset published on the OriginTrail DKG",
        keywords: ["test", "dataset", "dkg"],
        creator: {
          "@type": "Organization",
          name: "Test Organization"
        },
        datePublished: new Date().toISOString(),
        license: "https://creativecommons.org/licenses/by/4.0/"
      },
    };

    // Step 3: Create the knowledge asset
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
    console.log("Knowledge Asset Created:", JSON.stringify(asset, null, 2));
    console.log("Asset UAL:", asset.UAL);

  } catch (error) {
    console.error("Error during asset creation:", error);
  }
}

// Execute the function
(async () => {
  await createAsset();
})().catch((error) => console.error("Execution failed:", error));
