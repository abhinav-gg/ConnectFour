# AWS Secrets Manager Setup for ConnectFour

This guide explains how to set up AWS Secrets Manager for your ConnectFour application on EC2.

## 📋 Prerequisites

1. AWS CLI installed and configured
2. EC2 instance with appropriate IAM role
3. Your application secrets ready

## 🗝️ Step 1: Create the Secret in AWS Secrets Manager

### Option A: Using AWS CLI

```bash
# Create the secret with all your environment variables
aws secretsmanager create-secret \
    --name "connectfour/production" \
    --description "ConnectFour production environment variables" \
    --secret-string '{
        "JWT_SECRET": "your-jwt-secret-here",
        "GOOGLE_RECAPTCHA_SECRET_KEY": "your-recaptcha-secret",
        "GOOGLE_CLIENT_ID": "your-google-client-id",
        "GOOGLE_CLIENT_SECRET": "your-google-client-secret",
        "GOOGLE_CLIENT_REDIRECT_URI": "https://your-domain.com/auth/google/callback",
        "DISCORD_CLIENT_ID": "your-discord-client-id",
        "DISCORD_CLIENT_SECRET": "your-discord-client-secret",
        "DISCORD_BOT_TOKEN": "your-discord-bot-token",
        "RDS_HOST": "your-rds-endpoint",
        "RDS_PORT": "5432",
        "RDS_USER": "your-db-user",
        "RDS_PASSWORD": "your-db-password",
        "RDS_NAME": "your-database-name",
        "REDIS_HOST": "redis",
        "REDIS_PORT": "6379",
        "REDIS_PASSWORD": "your-redis-password",
        "ZOHO_USER": "your-zoho-user",
        "ZOHO_PWD": "your-zoho-password",
        "DYNAMODB_ACCESS": "aws",
        "DYNAMODB_PWD": "your-dynamodb-credentials",
        "CLIENT_URL": "https://your-domain.com",
        "NODE_ENV": "production"
    }' \
    --region us-east-1
```

### Option B: Using AWS Console

1. Go to AWS Secrets Manager in the AWS Console
2. Click "Store a new secret"
3. Choose "Other type of secret"
4. Select "Plaintext" and paste the JSON structure above
5. Name it `connectfour/production`
6. Add description: "ConnectFour production environment variables"
7. Click through to create the secret

## 🔐 Step 2: Create IAM Role for EC2

Create an IAM role that your EC2 instance will use to access the secret:

### IAM Policy JSON:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
            ],
            "Resource": [
                "arn:aws:secretsmanager:us-east-1:YOUR-ACCOUNT-ID:secret:connectfour/production-*"
            ]
        }
    ]
}
```

### Create the role:

```bash
# Create trust policy for EC2
cat > trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

# Create the IAM role
aws iam create-role \
    --role-name ConnectFour-EC2-SecretsAccess \
    --assume-role-policy-document file://trust-policy.json

# Create and attach the policy
cat > secrets-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
            ],
            "Resource": [
                "arn:aws:secretsmanager:us-east-1:*:secret:connectfour/production-*"
            ]
        }
    ]
}
EOF

aws iam put-role-policy \
    --role-name ConnectFour-EC2-SecretsAccess \
    --policy-name SecretsManagerAccess \
    --policy-document file://secrets-policy.json

# Create instance profile
aws iam create-instance-profile \
    --instance-profile-name ConnectFour-EC2-Profile

aws iam add-role-to-instance-profile \
    --instance-profile-name ConnectFour-EC2-Profile \
    --role-name ConnectFour-EC2-SecretsAccess
```

## 🖥️ Step 3: Launch EC2 Instance with IAM Role

```bash
# Launch EC2 instance with the IAM role
aws ec2 run-instances \
    --image-id ami-0abcdef1234567890 \
    --instance-type t3.medium \
    --iam-instance-profile Name=ConnectFour-EC2-Profile \
    --security-group-ids sg-your-security-group \
    --subnet-id subnet-your-subnet \
    --key-name your-key-pair \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=ConnectFour-Production}]'
```

## 🚀 Step 4: Deploy on EC2

1. SSH into your EC2 instance
2. Clone your repository
3. Run the deployment script:

```bash
# Clone repository
git clone https://github.com/abhinav-gg/ConnectFour.git
cd ConnectFour

# Make deployment script executable
chmod +x scripts/ec2-deploy.sh

# Set environment variables
export AWS_REGION="us-east-1"
export SECRET_NAME="connectfour/production"
export NODE_ENV="production"

# Run deployment
./scripts/ec2-deploy.sh
```

## 🔄 Step 5: Update Secrets

To update secrets without redeploying:

```bash
# Update the secret
aws secretsmanager update-secret \
    --secret-id "connectfour/production" \
    --secret-string '{
        "JWT_SECRET": "new-jwt-secret",
        ...
    }'

# Fetch updated secrets on EC2
cd /path/to/your/app
node scripts/fetch-secrets.js

# Restart containers
docker-compose restart
```

## 🏥 Monitoring and Troubleshooting

### Check if secrets are fetched correctly:
```bash
# Verify .env file exists and has content
cat backend/.env

# Test secret access
aws secretsmanager get-secret-value --secret-id "connectfour/production"
```

### Common Issues:

1. **"Access Denied"**: Check IAM role and policies
2. **"Secret not found"**: Verify secret name and region
3. **".env file empty"**: Check script logs and AWS credentials

## 🔐 Security Best Practices

1. **Rotate secrets regularly** using AWS Secrets Manager rotation
2. **Use least privilege** IAM policies
3. **Monitor access** with CloudTrail
4. **Encrypt secrets** (automatically done by Secrets Manager)
5. **Use VPC endpoints** for Secrets Manager in production

## 📊 Cost Optimization

- AWS Secrets Manager costs $0.40 per secret per month
- Plus $0.05 per 10,000 API calls
- Consider using Systems Manager Parameter Store for non-sensitive configs
