const ExpectedApiKey = process.env.SEARCH_API_KEY;

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

export const config = {
  apiKey: ExpectedApiKey,
  port: process.env.PORT || 3000,
};
