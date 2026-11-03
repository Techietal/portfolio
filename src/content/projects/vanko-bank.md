---
title: Vanko Bank
tagline: Cloud-native banking platform — onboarding, KYC, transfers and the full loan lifecycle on AWS.
order: 2
tech: [Angular, Node.js, Express, FastAPI, MongoDB, AWS, Docker, GitLab CI/CD]
links:
  - { label: Source on GitLab, url: "https://gitlab.com/chatgpt-workspace/bank-application" }
highlights:
  - EC2, ECS Fargate, ECR, S3, Lambda and SQS/DLQ architecture
  - GitLab CI/CD with immutable Docker builds
  - MongoDB transactions + idempotency for safe money movement
color: hot
featured: true
---
## What it does
A full-stack banking platform supporting onboarding, KYC, account management, transfers, loan origination and servicing, credit assessment, EMI payments, prepayments and foreclosure.

## What I built
- The application on **Angular**, **Node.js/Express**, **MongoDB** and **Python/FastAPI**.
- An AWS architecture using **EC2, ECS Fargate, ECR, S3, Lambda and SQS/DLQ**, supporting KYC extraction, credit-scoring services and event-driven notifications.
- **GitLab CI/CD** pipelines for testing, immutable Docker builds, ECR publishing, AWS deployment and post-deployment verification.
- **MongoDB transactions** and **idempotency controls** for reliable financial operations.
