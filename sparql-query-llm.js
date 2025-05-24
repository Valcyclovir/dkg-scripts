require('dotenv').config();
const DKGClient = require('dkg.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// DKG node options
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

// JSON-LD memory template for SocialMediaPosting
const dkgMemoryTemplate = {
  "@context": "http://schema.org",
  "@type": "SocialMediaPosting",
  headline: "<describe memory in a short way, as a title here>",
  articleBody:
    "Check out this amazing project on decentralized cloud networks! @DecentralCloud #Blockchain #Web3",
  author: {
    "@type": "Person",
    "@id": "uuid:john:doe",
    name: "John Doe",
    identifier: "@JohnDoe",
    url: "https://twitter.com/JohnDoe",
  },
  dateCreated: "yyyy-mm-ddTHH:mm:ssZ",
  interactionStatistic: [
    {
      "@type": "InteractionCounter",
      interactionType: {
        "@type": "LikeAction",
      },
      userInteractionCount: 150,
    },
    {
      "@type": "InteractionCounter",
      interactionType: {
        "@type": "ShareAction",
      },
      userInteractionCount: 45,
    },
  ],
  mentions: [
    {
      "@type": "Person",
      name: "Twitter account mentioned name goes here",
      identifier: "@TwitterAccount",
      url: "https://twitter.com/TwitterAccount",
    },
  ],
  keywords: [
    {
      "@type": "Text",
      "@id": "uuid:keyword1",
      name: "keyword1",
    },
    {
      "@type": "Text",
      "@id": "uuid:keyword2",
      name: "keyword2",
    },
  ],
  about: [
    {
      "@type": "Thing",
      "@id": "uuid:thing1",
      name: "Blockchain",
      url: "https://en.wikipedia.org/wiki/Blockchain",
    },
    {
      "@type": "Thing",
      "@id": "uuid:thing2",
      name: "Web3",
      url: "https://en.wikipedia.org/wiki/Web3",
    },
    {
      "@type": "Thing",
      "@id": "uuid:thing3",
      name: "Decentralized Cloud",
      url: "https://example.com/DecentralizedCloud",
    },
  ],
  url: "https://twitter.com/JohnDoe/status/1234567890",
};

// Example SPARQL query for reference
const combinedSparqlExample = `
SELECT DISTINCT ?headline ?articleBody
    WHERE {
      ?s a <http://schema.org/SocialMediaPosting> .
      ?s <http://schema.org/headline> ?headline .
      ?s <http://schema.org/articleBody> ?articleBody .

      OPTIONAL {
        ?s <http://schema.org/keywords> ?keyword .
        ?keyword <http://schema.org/name> ?keywordName .
      }

      OPTIONAL {
        ?s <http://schema.org/about> ?about .
        ?about <http://schema.org/name> ?aboutName .
      }

      FILTER(
        CONTAINS(LCASE(?headline), "example_keyword") ||
        (BOUND(?keywordName) && CONTAINS(LCASE(?keywordName), "example_keyword")) ||
        (BOUND(?aboutName) && CONTAINS(LCASE(?aboutName), "example_keyword"))
      )
    }
    LIMIT 10`;

// Fallback SPARQL query
const generalSparqlQuery = `
    SELECT DISTINCT ?headline ?articleBody
    WHERE {
      ?s a <http://schema.org/SocialMediaPosting> .
      ?s <http://schema.org/headline> ?headline .
      ?s <http://schema.org/articleBody> ?articleBody .
    }
    LIMIT 10
`;

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

// Construct SPARQL query using Gemini LLM
async function constructSparqlQuery(userQuery) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const context = `
      You are tasked with generating a SPARQL query to retrieve information from a Decentralized Knowledge Graph (DKG).
      The query should align with the JSON-LD memory template provided below:

      ${JSON.stringify(dkgMemoryTemplate)}

      ** Examples **
      Use the following SPARQL example to understand the format:
      ${combinedSparqlExample}

      ** Instructions **
      1. Analyze the user query and identify the key fields and concepts it refers to.
      2. Use these fields and concepts to construct a SPARQL query.
      3. Ensure the SPARQL query follows standard syntax and can be executed against the DKG.
      4. Use 'OR' logic when constructing the query to ensure broader matching results. For example, if multiple keywords or concepts are provided, the query should match any of them, not all.
      5. Replace the examples with actual terms from the user's query.
      6. Always select distinct results by adding the DISTINCT keyword.
      7. Always select headline and articleBody. Do not select other fields.
      8. Output the SPARQL query wrapped in a sparql code block for clarity (e.g., \`\`\`sparql\nQUERY\n\`\`\`).

      ** User Query **
      ${userQuery}

      ** Output **
      Provide only the SPARQL query wrapped in a sparql code block.
    `;
    
    const result = await model.generateContent(context);
    const responseText = await result.response.text();
    
    const sparqlQueryMatch = responseText.match(/```sparql([\s\S]*?)```/);
    if (!sparqlQueryMatch) {
      throw new Error("No valid SPARQL query found in Gemini response");
    }
    
    return sparqlQueryMatch[1].trim();
  } catch (error) {
    console.error("Error generating SPARQL query with Gemini:", error.message);
    throw error;
  }
}

async function executeQuery() {
  try {
    // Verify node connection
    console.log('Checking node connection...');
    const nodeInfo = await dkg.node.info();
    console.log('Connected to node:', nodeInfo);

    // Generate SPARQL query using LLM
    const userQuery = "Search for social media posts about blockchain or Web3 projects";
    console.log('Generating SPARQL query for:', userQuery);
    let sparqlQuery;
    try {
      sparqlQuery = await constructSparqlQuery(userQuery);
      console.log('Generated SPARQL query:\n', sparqlQuery);
    } catch (error) {
      console.error('Failed to generate SPARQL query, using fallback query.');
      sparqlQuery = generalSparqlQuery;
      console.log('Fallback SPARQL query:\n', sparqlQuery);
    }

    // Execute query
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
      // Try fallback query if LLM-generated query fails
      if (sparqlQuery !== generalSparqlQuery) {
        console.log('Retrying with fallback SPARQL query...');
        sparqlQuery = generalSparqlQuery;
        console.log('Fallback SPARQL query:\n', sparqlQuery);
        queryResult = await dkg.graph.query(sparqlQuery, 'SELECT', {
          blockchain: {
            name: node_options.blockchain.name,
            privateKey: node_options.blockchain.privateKey,
          },
          maxNumberOfRetries: node_options.maxNumberOfRetries,
          frequency: node_options.frequency,
        });
      } else {
        throw new Error(`DKG query failed: ${queryError.message}`);
      }
    }

    if (!queryResult || !queryResult.data) {
      throw new Error('DKG query failed: No data returned');
    }

    const results = queryResult.data.map(entry => {
      const formattedParts = Object.keys(entry).map(key => `${key}: ${entry[key]}`);
      return formattedParts.join(', ');
    });

    console.log('Query Results:\n', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error executing query:', error.message);
    throw error;
  }
}

// Run the script
executeQuery().catch(error => console.error('Execution failed:', error));