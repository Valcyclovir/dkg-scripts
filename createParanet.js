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

async function createParanet() {
  try {
    // Step 1: Verify node connection
    await checkNodeConnection();

    // Step 2: Define the profile knowledge asset content
    const profileContent = {
      public: {
        "@context": "http://schema.org",
        "@type": "DataCatalog",
        name: process.env.PROFILE_NAME,
      },
    };

    // Step 3: Create the profile knowledge collection
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

    let ual;
    let asset;

    // Step 4: Check if PARANET_UAL is defined
    if (process.env.PARANET_UAL && process.env.PARANET_UAL.trim() !== "") {
      // Use the provided PARANET_UAL
      ual = `${process.env.PARANET_UAL}/1`;
      console.log("Using provided PARANET_UAL:", ual);
    } else {
      // Create a new asset and use its UAL
      asset = await dkg.asset.create(profileContent, assetOptions);
      console.log("Profile Knowledge Collection Created:", JSON.stringify(asset, null, 2));
      console.log("Profile KC UAL:", asset.UAL);
      ual = `${asset.UAL}/1`;
    }

    // Step 5: Create the Paranet
    const paranetOptions = {
      environment: process.env.ENVIRONMENT,
      paranetName: process.env.PARANET_NAME,
      paranetDescription: process.env.PARANET_DESCRIPTION,
      paranetNodesAccessPolicy: parseInt(process.env.PARANET_NODES_ACCESS_POLICY),
      paranetMinersAccessPolicy: parseInt(process.env.PARANET_MINERS_ACCESS_POLICY),
      paranetKcSubmissionPolicy: parseInt(process.env.PARANET_KC_SUBMISSION_POLICY),
      blockchain: {
        name: process.env.BLOCKCHAIN_NAME,
        privateKey: process.env.PRIVATE_KEY,
      },
    };

    const paranet = await dkg.paranet.create(ual, paranetOptions);
    console.log("Paranet Created:", JSON.stringify(paranet, null, 2));
    console.log("Paranet UAL:", paranet);

  } catch (error) {
    console.error("Error during Paranet creation:", error);
  }
}

// Execute the function
(async () => {
  await createParanet();
})().catch((error) => console.error("Execution failed:", error));
