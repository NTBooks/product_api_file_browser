# Chainletter Product API Learning Repository

A comprehensive collection of examples demonstrating how to integrate with the Chainletter Product API. This repository contains examples ranging from simple client-side utilities to complex full-stack applications, designed to help you understand and implement blockchain file storage and verification.

## 🎯 What is Chainletter?

Chainletter provides a webhook-based API for uploading files to IPFS (InterPlanetary File System) and creating blockchain timestamps. This enables:

- **Decentralized File Storage**: Files are stored on IPFS, a distributed file system
- **Blockchain Verification**: Create immutable timestamps on the blockchain
- **Cost-Effective Stamping**: Batch operations to minimize blockchain transaction costs
- **Real-time Events**: Webhook streams for monitoring file and collection status

## 📚 Learning Path

This repository is organized by complexity, from simple utilities to full applications:

### 🔧 **Client-Side Utilities** (No Server Required)

- **Example 6**: [Local IPFS Hash Calculator](simple_example_6_local_hash/) - Calculate IPFS CIDs locally
- **Example 7**: [CLStamp File Creator](simple_example_7_create_clstamp_file/) - Create verification files locally

### 🚀 **Simple API Examples** (Single File)

- **Example 3**: [Minimal Upload & Stamp](simplest_example_3_upload_and_stamp/) - The simplest possible API integration
- **Example 2**: [Quiz to Certificate](simple_example_2_quiz_to_cert/) - Generate and upload certificates
- **Example 4**: [Event Listener](simple_example_4_events/) - Real-time webhook event monitoring
- **Example 5**: [Cost-Saving Scheduler](simple_example_5_cost_savings_schedule/) - Batch processing for cost optimization

### 🏗️ **Complex Applications** (Full-Stack)

- **Example 1**: [React File Browser](complex_example_1_file_browser/) - Complete file management interface
- **Example 8**: [Upload with CLStamp](complex_example_8_upload_and_clstamp/) - Advanced file processing with verification

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Chainletter API credentials (get them from [chainletter.io](https://chainletter.io))

### Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd product_api_file_browser
   ```

2. **Install dependencies**:

   ```bash
   npm run install-all
   ```

3. **Configure API credentials**:
   ```bash
   cp env.example .env
   # Edit .env with your API credentials
   ```

## 📖 Example Overview

### Client-Side Examples (Open in Browser)

#### Example 6: Local IPFS Hash Calculator

**Purpose**: Learn how to calculate IPFS CIDs locally without uploading

- **Run**: Open `simple_example_6_local_hash/index.html` in your browser
- **Learn**: IPFS hash calculation, client-side file processing
- **Use Case**: Verify file integrity, prepare files for upload

#### Example 7: CLStamp File Creator

**Purpose**: Create verification files that can be shared independently

- **Run**: Open `simple_example_7_create_clstamp_file/index.html` in your browser
- **Learn**: File packaging, hash verification, downloadable stamps
- **Use Case**: Create portable verification files, share proof of existence

### Simple Server Examples

#### Example 3: Minimal Upload & Stamp

**Purpose**: The simplest possible API integration

- **Run**: `npm run ex3`
- **Learn**: Basic file upload, immediate stamping, API authentication
- **Use Case**: Quick file timestamping, API testing

#### Example 2: Quiz to Certificate

**Purpose**: Generate dynamic content and upload to blockchain

- **Run**: `npm run ex2`
- **Learn**: Dynamic file generation, collection management, status monitoring
- **Use Case**: Educational certificates, achievement badges, dynamic content

#### Example 4: Event Listener

**Purpose**: Monitor real-time API events

- **Run**: `npm run ex4`
- **Learn**: Webhook event streams, real-time monitoring, event handling
- **Use Case**: Application monitoring, status tracking, automation triggers

#### Example 5: Cost-Saving Scheduler

**Purpose**: Optimize costs through batch processing

- **Run**: `npm run ex5`
- **Learn**: Batch operations, scheduled processing, cost optimization
- **Use Case**: High-volume applications, cost-sensitive deployments

### Complex Applications

#### Example 1: React File Browser

**Purpose**: Complete file management interface with modern UI

- **Run**: `npm run ex1`
- **Learn**: Full-stack development, React integration, advanced UI patterns
- **Use Case**: Production applications, user-facing interfaces

#### Example 8: Upload with CLStamp

**Purpose**: Advanced file processing with verification

- **Run**: `npm run ex8`
- **Learn**: Complex file workflows, verification systems, advanced packaging
- **Use Case**: Document verification, legal applications, audit trails

## 🔑 API Concepts

### Core Operations

1. **File Upload** (`POST /webhook/{apikey}`)

   - Upload files to IPFS
   - Organize into collections
   - Optional immediate stamping

2. **Collection Stamping** (`PATCH /webhook/{apikey}`)

   - Create blockchain timestamps
   - Batch multiple files
   - Cost-effective verification

3. **File Retrieval** (`GET /webhook/{apikey}`)

   - List files and collections
   - Get file metadata
   - Retrieve verification data

4. **File Deletion** (`DELETE /webhook/{apikey}`)
   - Remove files from collections
   - Clean up unused files

### Event Streams

Monitor real-time events:

- `file.uploaded` - File uploaded to IPFS
- `file.pinned` - File pinned and ready
- `collection.stamped` - Collection timestamped on blockchain
- `file.deleted` - File removed

## 💡 Best Practices

### Cost Optimization

- **Batch Operations**: Stamp collections instead of individual files
- **Scheduled Processing**: Use timers for non-urgent files
- **Smart Caching**: Cache file hashes and metadata

### Security

- **Environment Variables**: Store API credentials securely
- **Server-Side Processing**: Handle sensitive operations on backend
- **Input Validation**: Validate all user inputs

### Performance

- **Lazy Loading**: Load files on demand
- **Progress Indicators**: Show upload and processing status
- **Error Handling**: Graceful failure recovery

## 🛠️ Development

### Running Examples

```bash
# Install all dependencies
npm run install-all

# Run specific examples
npm run ex1  # React file browser (Client: 3040, Server: 3041)
npm run ex2  # Quiz to certificate (3042)
npm run ex3  # Simple upload and stamp (3043)
npm run ex4  # Event-driven processing (3044)
npm run ex5  # Scheduled stamping (3045)
# Examples 6 & 7: Open index.html directly in browser (client-side only)
npm run ex8  # Upload with CLStamp (3048)

# Development mode
npm run dev  # Start all examples simultaneously
```

### Environment Configuration

Create a `.env` file with your API credentials:

```env
# API credentials
API_KEY=your-api-key-here
API_SECRET=your-api-secret-here
API_NETWORK=public  # or private

# Server configuration
SESSION_SECRET=your-session-secret
PORT=3001
```

## 🔗 API Reference

### Base URL

```
https://api.chainletter.io
```

### Authentication

All requests require API key authentication via URL path parameter:

```
/webhook/{apikey}
```

### Rate Limits

- File uploads: 10 per minute
- Collection stamps: 5 per minute
- API calls: 100 per minute

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: [chainletter.io/docs](https://chainletter.io/docs)
- **API Reference**: [chainletter.io/api](https://chainletter.io/api)
- **Community**: [Discord](https://discord.gg/chainletter)

---

**Ready to get started?** Begin with [Example 3](simplest_example_3_upload_and_stamp/) for the simplest integration, or jump to [Example 1](complex_example_1_file_browser/) for a complete application experience.
