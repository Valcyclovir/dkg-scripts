// File: simpleSparqlQuery.js
const DKGClient = require('dkg.js');

// Hardcoded configuration, aligned with graphSearch.ts
const node_options = {
  endpoint: 'http://localhost', // Use http://localhost per your note
  port: '8900',
  blockchain: {
    name: 'otp:2043', // Matches UAL chain ID; adjust if needed
    publicKey: '',
    privateKey: 'REDACTED', // Your private key
  },
  environment: 'testnet', // Adjust to 'development' for Hardhat
  maxNumberOfRetries: 300,
  frequency: 2,
  contentType: 'all',
  nodeApiVersion: '/v1',
  useSSL: false,
};

// Validate configuration
function validateConfig(config) {
  const requiredStringFields = ['endpoint', 'port', 'environment'];
  for (const field of requiredStringFields) {
    if (typeof config[field] !== 'string' || !config[field]) {
      throw new Error(`Invalid configuration: Missing or invalid value for '${field}'`);
    }
  }
  if (!config.blockchain || typeof config.blockchain !== 'object') {
    throw new Error("Invalid configuration: 'blockchain' must be an object");
  }
  const blockchainFields = ['name', 'publicKey', 'privateKey'];
  for (const field of blockchainFields) {
    if (typeof config.blockchain[field] !== 'string') {
      throw new Error(`Invalid configuration: Missing or invalid value for 'blockchain.${field}'`);
    }
  }
}

// Initialize DKG Client
validateConfig(node_options);
const dkg = new DKGClient(node_options);

// Simple SPARQL query
const sparqlQuery = `
PREFIX SCHEMA: <http://schema.org/>
SELECT DISTINCT ?asset ?name ?description
WHERE {
  ?asset a SCHEMA:DataCatalog ;
         SCHEMA:name ?name ;
         SCHEMA:description ?description .
}
LIMIT 10
`.trim();

async function executeQuery() {
  try {
    // Verify node connection
    console.log('Checking node connection...');
    const nodeInfo = await dkg.node.info();
    console.log('Connected to node:', nodeInfo);

    // Execute primary query
    console.log('Executing SPARQL query:\n', sparqlQuery);
    let queryResult;
    try {
      queryResult = await dkg.graph.query(sparqlQuery, 'SELECT', {
        blockchain: {
          name: node_options.blockchain.name,
          publicKey: node_options.blockchain.publicKey,
          privateKey: node_options.blockchain.privateKey,
        },
        maxNumberOfRetries: node_options.maxNumberOfRetries,
        frequency: node_options.frequency,
      });
    } catch (queryError) {
      console.error('Raw query error:', queryError.message);
      throw new Error(`DKG query failed: ${queryError.message}`);
    }

    if (!queryResult || !queryResult.data) {
      throw new Error('DKG query failed: No data returned');
    }

    const results = queryResult.data.map(entry => {
      const formattedParts = Object.keys(entry).map(key => `${key}: ${entry[key]}`);
      return formattedParts.join(', ');
    });

    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error executing query:', error.message);
    throw error;
  }
}

// Run the script
executeQuery().catch(error => console.error('Execution failed:', error));