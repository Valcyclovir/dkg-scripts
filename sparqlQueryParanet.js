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
  useSSL: process.env.USE_SSL,
};

// Load PARANET_UAL
const PARANET_UAL = process.env.PARANET_UAL;

function validateConfig(config, paranetUAL) {
  console.log('Validating configuration...');
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
  if (!paranetUAL || typeof paranetUAL !== 'string') {
    throw new Error("Invalid configuration: 'PARANET_UAL' must be a string");
  }
  const ualPattern = /^did:dkg:base:84532\/0x[a-fA-F0-9]{40}\/\d+\/\d+$/;
  if (!ualPattern.test(paranetUAL)) {
    throw new Error("Invalid configuration: 'PARANET_UAL' has an invalid format");
  }
  console.log('Configuration validated successfully.');
  console.log('Config:', {
    endpoint: config.endpoint,
    port: config.port,
    blockchain: config.blockchain.name,
    maxNumberOfRetries: config.maxNumberOfRetries,
    frequency: config.frequency
  });
}

// Initialize DKG Client
try {
  validateConfig(node_options, PARANET_UAL);
} catch (error) {
  console.error('Configuration validation failed:', error.message);
  process.exit(1);
}
const dkg = new DKGClient(node_options);

// Modified SPARQL query to retrieve specific asset details from Paranet
const sparqlQuery = `
PREFIX dkg: <https://ontology.origintrail.io/dkg/1.0#>
PREFIX schema: <http://schema.org/>

SELECT DISTINCT ?asset ?name ?description (GROUP_CONCAT(?keyword; separator=", ") AS ?keywords) ?datePublished ?creator ?license ?eventType ?image ?isReal ?namedGraph
WHERE {
  # Get all named graphs in the Paranet
  GRAPH <${PARANET_UAL}> {
    <${PARANET_UAL}> dkg:hasNamedGraph ?namedGraph .
  }

  # Query within the named graphs
  GRAPH ?namedGraph {
    ?asset a schema:Event .
    
    OPTIONAL { ?asset schema:name ?name . }
    OPTIONAL { ?asset schema:description ?description . }
    OPTIONAL { ?asset schema:keywords ?keyword . }
    OPTIONAL { ?asset schema:datePublished ?datePublished . }
    OPTIONAL { ?asset schema:creator ?creator . }
    OPTIONAL { ?asset schema:license ?license . }
    OPTIONAL { ?asset schema:eventType ?eventType . }
    OPTIONAL { ?asset schema:image ?image . }
    OPTIONAL { ?asset schema:isReal ?isReal . }
  }
}
GROUP BY ?asset ?name ?description ?datePublished ?creator ?license ?eventType ?image ?isReal ?namedGraph
LIMIT 50
`.trim();

async function executeQuery() {
  try {
    // Verify node connection
    console.log('Checking node connection...');
    const nodeInfo = await dkg.node.info();
    console.log('Connected to node:', JSON.stringify(nodeInfo, null, 2));

    // Wait for graph propagation
    console.log('Waiting for graph propagation (5 minutes)...');
    await new Promise(resolve => setTimeout(resolve, 100)); // 5 minutes

    // Execute query with PARANET_UAL
    console.log('Executing SPARQL query with PARANET_UAL:\n', sparqlQuery);
    console.log('Query options:', {
      blockchain: node_options.blockchain.name,
      maxNumberOfRetries: node_options.maxNumberOfRetries,
      frequency: node_options.frequency,
    });
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

    console.log('Query results:', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error executing query:', error.message);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

// Run the script
executeQuery().catch(error => {
  console.error('Execution failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});