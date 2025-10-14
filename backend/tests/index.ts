import runBotTests from "./botTest";

// If this file is run directly, execute the bot tests
if (require.main === module) {
    runBotTests().catch(err => {
        console.error('Error running bot tests:', err);
        process.exit(1);
    });
}