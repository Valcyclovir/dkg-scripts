// File: simpleSparqlQuery.js
const DKGClient = require('dkg.js');
require('dotenv').config();

// Configuration from .env
const node_options = {
  endpoint: process.env.OTNODE_HOST,
  port: process.env.OTNODE_PORT,
  blockchain: {
    name: process.env.BLOCKCHAIN_NAME,
    privateKey: process.env.PRIVATE_KEY,
  },
  maxNumberOfRetries: parseInt(process.env.MAX_NUMBER_OF_RETRIES),
  frequency: parseInt(process.env.FREQUENCY),
  contentType: process.env.CONTENT_TYPE,
  nodeApiVersion: '/v1',
  useSSL: process.env.USE_SSL,
};

// Validate configuration
function validateConfig(config) {
  const requiredStringFields = ['endpoint', 'port'];
  for (const field of requiredStringFields) {
    if (typeof config[field] !== 'string' || !config[field]) {
      throw new Error(`Invalid configuration: Missing or invalid value for '${field}'`);
    }
  }
  if (!config.blockchain || typeof config.blockchain !== 'object') {
    throw new Error("Invalid configuration: 'blockchain' must be an object");
  }
  const blockchainFields = ['name', 'privateKey'];
  for (const field of blockchainFields) {
    if (typeof config.blockchain[field] !== 'string' || !config.blockchain[field]) {
      throw new Error(`Invalid configuration: Missing or invalid value for 'blockchain.${field}'`);
    }
  }
}

// Initialize DKG Client
validateConfig(node_options);
const dkg = new DKGClient(node_options);

// Diagnostic SPARQL query to list schema:Event assets
const sparqlQuery = `
PREFIX schema: <http://schema.org/>

SELECT ?asset ?name ?description
WHERE {
  GRAPH ?g {
    ?asset a schema:Event ;
      schema:name ?name .
    OPTIONAL { ?asset schema:description ?description . }
  }
}
LIMIT 10
`.trim();

async function executeQuery() {
  try {
    // Verify node connection
    console.log('Checking node connection...');
    const nodeInfo = await dkg.node.info();
    console.log('Connected to node:', nodeInfo);

    // Execute SPARQL query
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
      console.log('No schema:Event assets found');
      return;
    }

    console.log('Found schema:Event assets:');
    console.log(JSON.stringify(queryResult.data, null, 2));
  } catch (error) {
    console.error('Error executing query:', error.message);
    throw error;
  }
}

// Run the script
executeQuery().catch(error => console.error('Execution failed:', error));