const DKGClient = require("dkg.js");
require("dotenv").config();

const node_options = {
  endpoint: process.env.OTNODE_HOST,
  port: process.env.OTNODE_PORT,
  blockchain: {
    name: process.env.BLOCKCHAIN_NAME,
    privateKey: process.env.PRIVATE_KEY,
  },
  useSSL: false,
  maxNumberOfRetries: 100,
};

const dkg = new DKGClient(node_options);

async function getParanetData() {
  try {
    // Step 1: Verify node connection
    const nodeInfo = await dkg.node.info();
    console.log("Connected to node:", nodeInfo);

    // Step 2: Define the Paranet UAL
    // Use your actual Paranet UAL once confirmed; this is a placeholder
    const paranetUAL = process.env.PARANET_UAL;
    console.log("Fetching data for Paranet UAL:", paranetUAL);

    // Step 3: Get Paranet data
    const paranetData = await dkg.asset.get(paranetUAL, {
      environment: process.env.ENVIRONMENT,
      blockchain: {
        name: process.env.BLOCKCHAIN_NAME,
        privateKey: process.env.PRIVATE_KEY,
      },
      validate: true, // Optional: Validate the Paranet data (per V8 docs)
    });

    console.log("Paranet Data:", JSON.stringify(paranetData, null, 2));

  } catch (error) {
    console.error("Error fetching Paranet data:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
  }
}

(async () => {
  await getParanetData();
})().catch((error) => console.error("Execution failed:", error));
