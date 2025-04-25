const ExpectedApiKey = process.env.SEARCH_API_KEY;
const GeminiApiKey = process.env.GEMINI_API_KEY;
const LoadDemoData = process.env.LOAD_DEMO_DATA;

if (!ExpectedApiKey) {
  console.error(
    "\n💥 FATAL ERROR: SEARCH_API_KEY environment variable is not set."
  );
  console.error("The search engine requires an API key for security.");
  console.error(
    "Please create a .env file with SEARCH_API_KEY=your-secret-key"
  );
  console.error("or set the environment variable directly and restart.\n");
  process.exit(1); // Exit if the API key is missing
} else {
  console.log("✅ SEARCH_API_KEY loaded successfully.");
}

if (!GeminiApiKey) {
  console.warn(
    "🟡 GEMINI_API_KEY environment variable is not set. AI config generation endpoint will be disabled."
  );
} else {
  console.log("✅ GEMINI_API_KEY loaded.");
}

if (!LoadDemoData) {
  console.warn(
    "🟡 LOAD_DEMO_DATA environment variable is not set. Demo data will not be loaded."
  );
} else {
  console.log("✅ LOAD_DEMO_DATA loaded.");
}

export const config = {
  apiKey: ExpectedApiKey,
  port: process.env.PORT || 3000,
  geminiApiKey: GeminiApiKey,
  loadDemoData: LoadDemoData === "true",
};
