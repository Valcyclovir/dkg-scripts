require("dotenv").config();
const fs = require("fs");
const path = require("path");
const DKGClient = require("dkg.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Constants from constants.ts
const DKG_EXPLORER_LINKS = {
  testnet: "https://dkg-testnet.origintrail.io/explore?ual=",
  mainnet: "https://dkg.origintrail.io/explore?ual=",
};

const dkgMemoryTemplate = {
  "@context": "http://schema.org",
  "@type": "Event",
  "name": "<short title summarizing the event>",
  "description": "<the exact content of the input text>",
  "startDate": "yyyy-mm-ddTHH:mm:ssZ",
  "organizer": {
    "@type": "Organization",
    "@id": "uuid:generic:organizer",
    "name": "Anonymous Organizer",
    "url": "https://example.com/organizer"
  },
  "keywords": [
    {
      "@type": "Text",
      "@id": "uuid:keyword1",
      "name": "keyword1"
    }
  ],
  "about": [
    {
      "@type": "Thing",
      "@id": "uuid:thing1",
      "name": "Topic1",
      "url": "https://example.com/Topic1"
    }
  ],
  "license": "https://creativecommons.org/licenses/by/4.0/"
};

// Template for JSON-LD generation
const createDKGMemoryTemplate = `
You are tasked with creating a structured memory JSON-LD object for an AI agent. The memory represents the interaction captured via social media. Your goal is to extract all relevant information from the provided user query and additionalContext which contains previous user queries (only if relevant for the current user query) to populate the JSON-LD memory template provided below.

** Template **
The memory should follow this JSON-LD structure:
${JSON.stringify(dkgMemoryTemplate)}

** Instructions **
1. Extract the main idea of the user query and use it to create a concise and descriptive title for the memory. This should go in the "headline" field.
2. Store the original post in "articleBody".
3. Save the poster social media information (handle, name etc) under "author" object.
4. For the "about" field:
   - Identify the key topics or entities mentioned in the user query and add them as Thing objects.
   - Use concise, descriptive names for these topics.
   - Where possible, create an @id identifier for these entities, using either a provided URL, or a well known URL for that entity. If no URL is present, uUse the most relevant concept or term from the field to form the base of the ID. @id fields must be valid uuids or URLs
5. For the "keywords" field:
   - Extract relevant terms or concepts from the user query and list them as keywords.
   - Ensure the keywords capture the essence of the interaction, focusing on technical terms or significant ideas.
6. Ensure all fields align with the schema.org ontology and accurately represent the interaction.
7. Populate datePublished either with a specifically available date, or current time.

** Input **
User Query: {{currentPost}}
Recent messages: {{recentMessages}}

** Output **
Generate the memory in the exact JSON-LD format provided above, fully populated based on the input query.
Make sure to only output the JSON-LD object. DO NOT OUTPUT ANYTHING ELSE, DONT ADD ANY COMMENTS OR REMARKS, JUST THE JSON LD CONTENT WRAPPED IN { }.
`;

// DKG node options
const node_options = {
  endpoint: process.env.OTNODE_HOST,
  port: process.env.OTNODE_PORT,
  blockchain: {
    name: process.env.BLOCKCHAIN_NAME,
    privateKey: process.env.PRIVATE_KEY,
  },
  useSSL: process.env.USE_SSL === "true",
  maxNumberOfRetries: parseInt(process.env.MAX_NUMBER_OF_RETRIES) || 100,
  frequency: parseInt(process.env.FREQUENCY) || 2,
};

const dkg = new DKGClient(node_options);

// Check node connection
async function checkNodeConnection() {
  try {
    const nodeInfo = await dkg.node.info();
    console.log("Connected to node:", nodeInfo);
  } catch (error) {
    throw new Error("Node connection failed: " + error.message);
  }
}

// Convert text to JSON-LD using Gemini
async function convertTextToJsonLd(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = createDKGMemoryTemplate.replace("{{currentPost}}", text);
    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();

    // Extract JSON-LD from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON-LD object found in Gemini response");
    }

    let jsonLd;
    try {
      jsonLd = JSON.parse(jsonMatch[0].trim());
    } catch (error) {
      throw new Error("Failed to parse JSON-LD from Gemini response: " + error.message);
    }

    // Validate that description matches the input text
    if (jsonLd.public && jsonLd.public.description !== text) {
      console.warn("Warning: Generated description does not match input text. Overriding with input text.");
      jsonLd.public.description = text;
    }

    return jsonLd;
  } catch (error) {
    throw new Error("Error converting text to JSON-LD: " + error.message);
  }
}

// Process assets
async function processAssets() {
  const assetsDir = process.env.ASSETS_DIR || "assets";
  let assetFiles;

  try {
    assetFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.txt'));
    if (assetFiles.length === 0) {
      console.log(`No asset files found in directory: ${assetsDir}`);
      return;
    }
  } catch (err) {
    console.error(`Failed to read assets directory: ${assetsDir}`, err);
    return;
  }

  for (const file of assetFiles) {
    const filePath = path.join(assetsDir, file);
    let assetContent;

    console.log(`\nProcessing file: ${file}`);

    try {
      if (file.endsWith(".txt")) {
        // Process .txt file with Gemini
        const textContent = fs.readFileSync(filePath, "utf8");
        console.log(`Converting text from ${file} to JSON-LD using Gemini...`);
        const jsonLd = await convertTextToJsonLd(textContent);
        assetContent = { public: jsonLd.public || jsonLd };
        console.log("Generated JSON-LD:", JSON.stringify(assetContent, null, 2));
      } else {
        // Process .json or .jsonld file
        const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
        assetContent = content.public ? content : { public: content };
      }
    } catch (err) {
      console.error(`Failed to process file: ${filePath}`, err);
      continue;
    }

    try {
      await checkNodeConnection();
      const assetOptions = {
        epochsNum: parseInt(process.env.EPOCHS_NUM) || 2,
        maxNumberOfRetries: parseInt(process.env.MAX_NUMBER_OF_RETRIES) || 30,
        frequency: parseInt(process.env.FREQUENCY) || 2,
        contentType: process.env.CONTENT_TYPE || "all",
        blockchain: {
          name: process.env.BLOCKCHAIN_NAME,
          privateKey: process.env.PRIVATE_KEY,
        },
      };

      // Create asset on DKG
      const asset = await dkg.asset.create(assetContent, assetOptions);
      console.log("Knowledge Asset Created:", JSON.stringify(asset, null, 2));
      console.log("Asset UAL:", asset.UAL);
      console.log(
        "Explore at:",
        `${DKG_EXPLORER_LINKS.testnet}${asset.UAL}`
      );

      // Submit to Paranet if PARANET_UAL is set
      if (process.env.PARANET_UAL) {
        try {
          const submitResult = await dkg.asset.submitToParanet(asset.UAL, process.env.PARANET_UAL);
          console.log("Asset Submitted to Paranet:", JSON.stringify(submitResult, null, 2));
        } catch (submitError) {
          console.error("Failed to submit asset to Paranet:", submitError.message);
        }
      } else {
        console.log("PARANET_UAL not specified, skipping Paranet submission.");
      }
    } catch (error) {
      console.error("Error during asset creation for file", file, error);
    }
  }
}

// Execute the function
(async () => {
  await processAssets();
})();