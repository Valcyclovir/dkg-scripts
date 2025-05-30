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

async function createParanetFromUAL() {
  try {
    // Step 1: Verify node connection
    await checkNodeConnection();

    // Step 2: Use your existing profile knowledge asset UAL
    const profileUAL = process.env.PARANET_UAL;
    console.log("Using Profile UAL:", profileUAL);

    // Step 3: Define Paranet options
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

    // Step 4: Create the Paranet
    const paranetUALInput = `${profileUAL}/1`; 
    console.log("Creating Paranet with UAL:", paranetUALInput);

    const paranet = await dkg.paranet.create(paranetUALInput, paranetOptions);
    console.log("Paranet Created:", JSON.stringify(paranet, null, 2));
    console.log("Paranet UAL:", paranet.UAL);

  } catch (error) {
    console.error("Error during Paranet creation:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
  }
}

// Execute the function
(async () => {
  await createParanetFromUAL();
})().catch((error) => console.error("Execution failed:", error));
