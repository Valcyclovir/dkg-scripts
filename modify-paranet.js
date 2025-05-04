const DKGClient = require("dkg.js");
require("dotenv").config();

const node_options = {
  endpoint: process.env.OTNODE_HOST,
  port: process.env.OTNODE_PORT,
  useSSL: false,
  maxNumberOfRetries: 100,
};

const dkg = new DKGClient(node_options);

async function modifyParanetPolicy() {
  try {
    // Step 1: Verify node connection
    const nodeInfo = await dkg.node.info();
    console.log("Connected to node:", nodeInfo);

    // Step 2: Validate PROFILE_UAL
    if (!process.env.PROFILE_UAL || process.env.PROFILE_UAL.trim() === "") {
      throw new Error("PROFILE_UAL is not defined in .env");
    }
    const profileUAL = process.env.PROFILE_UAL;
    console.log("Using Profile Knowledge Asset UAL:", `${profileUAL}/0`);

    // Step 3: Create or modify Paranet with updated policy
    const paranetOptions = {
      environment: process.env.ENVIRONMENT,
      paranetName: process.env.PARANET_NAME,
      paranetDescription: process.env.PARANET_DESCRIPTION,
      paranetNodesAccessPolicy: parseInt(process.env.PARANET_NODES_ACCESS_POLICY),
      paranetMinersAccessPolicy: parseInt(process.env.PARANET_MINERS_ACCESS_POLICY),
      paranetKcSubmissionPolicy: parseInt(process.env.PARANET_KC_SUBMISSION_POLICY),
      blockchain: {
        name: process.env.BLOCKCHAIN_NAME,
        publicKey: process.env.PUBLIC_KEY,
        privateKey: process.env.PRIVATE_KEY,
        handleNotMinedError: true,
      },
    };

    // If PARANET_UAL is defined, log it for reference
    if (process.env.PARANET_UAL && process.env.PARANET_UAL.trim() !== "") {
      console.log("Referencing existing Paranet UAL:", process.env.PARANET_UAL);
    }

    const paranet = await dkg.paranet.create(`${profileUAL}/0`, paranetOptions);
    console.log("Paranet Modified with Updated Policy:", JSON.stringify(paranet, null, 2));
    console.log("Paranet UAL:", paranet);

  } catch (error) {
    console.error("Error modifying Paranet policy:", error);
  }
}

// Execute the function
(async () => {
  await modifyParanetPolicy();
})().catch((error) => console.error("Execution failed:", error));
