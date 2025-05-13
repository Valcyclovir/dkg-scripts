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
      paranetName: "DKG Swarm Paranet",
      paranetDescription: "A decentralized ecosystem of OriginTrail builders and AI agents growing the AI Agent Swarm together. Visit dkgswarm.com!",
      paranetNodesAccessPolicy: 0, // Open access (public)
      paranetMinersAccessPolicy: 0, // Open access (public)
      paranetKcSubmissionPolicy: 0, // Open access (public)
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
