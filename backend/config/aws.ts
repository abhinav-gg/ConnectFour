// AWS Secrets Manager integration for ConnectFour
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configuration based on environment
const config = {
  region: process.env.AWS_REGION || 'us-east-1',
  secretName: process.env.SECRET_NAME || `connectfour/${process.env.NODE_ENV || 'production'}`,
  envFilePath: process.env.ENV_FILE_PATH || path.join(__dirname, '../.env')
};

const secretsManager = new AWS.SecretsManager({ region: config.region });

async function fetchAndCreateEnv() {
  try {
    console.log(`🔍 Fetching secrets from: ${config.secretName} in ${config.region}`);
    
    const result = await secretsManager.getSecretValue({
      SecretId: config.secretName
    }).promise();
    
    if (!result.SecretString) {
      throw new Error('Secret value is empty');
    }
    
    const secrets = JSON.parse(result.SecretString);
    
    // Convert to .env format
    const envContent = Object.entries(secrets)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Ensure directory exists
    const envDir = path.dirname(config.envFilePath);
    if (!fs.existsSync(envDir)) {
      fs.mkdirSync(envDir, { recursive: true });
    }
    
    fs.writeFileSync(config.envFilePath, envContent);
    console.log(`✅ .env file created at: ${config.envFilePath}`);
    console.log(`📊 Loaded ${Object.keys(secrets).length} environment variables`);
    
  } catch (err) {
    const error = err as any; // AWS SDK error handling
    console.error('❌ Error fetching secrets:', error.message);
    
    // Provide helpful debugging info
    if (error.code === 'ResourceNotFoundException') {
      console.error(`💡 Secret '${config.secretName}' not found. Check the secret name and region.`);
    } else if (error.code === 'UnauthorizedOperation' || error.code === 'AccessDenied') {
      console.error('💡 Access denied. Check IAM permissions for SecretsManager:GetSecretValue');
    }
    
    throw error;
  }
}

// Export for programmatic use
module.exports = { fetchAndCreateEnv, config };

// Run if executed directly
if (require.main === module) {
  fetchAndCreateEnv()
    .then(() => {
      console.log('🎉 Secrets fetch completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to fetch secrets:', error.message);
      process.exit(1);
    });
}