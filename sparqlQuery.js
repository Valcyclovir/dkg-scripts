require('dotenv').config();
const DKGClient = require('dkg.js');

const node_options = {
  endpoint: process.env.OTNODE_HOST || 'http://localhost',
  port: process.env.OTNODE_PORT || '8900',
  blockchain: {
    name: process.env.BLOCKCHAIN_NAME || 'base:84532',
    privateKey: process.env.PRIVATE_KEY || '',
  },
  maxNumberOfRetries: parseInt(process.env.MAX_NUMBER_OF_RETRIES) || 300,
  frequency: parseInt(process.env.FREQUENCY) || 2,
  contentType: process.env.CONTENT_TYPE || 'all',
  nodeApiVersion: '/v1',
  useSSL: process.env.USE_SSL === 'true',
};

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

// SPARQL query to retrieve Dataset assets
const sparqlQuery = `
PREFIX SCHEMA: <http://schema.org/>
SELECT DISTINCT ?asset ?name ?description ?keywords ?datePublished
WHERE {
  ?asset a SCHEMA:Dataset ;
         SCHEMA:name ?name ;
         SCHEMA:description ?description .
  OPTIONAL { ?asset SCHEMA:keywords ?keywords . }
  OPTIONAL { ?asset SCHEMA:datePublished ?datePublished . }
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