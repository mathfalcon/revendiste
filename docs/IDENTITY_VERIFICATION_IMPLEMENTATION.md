# Identity Verification System - Implementation Summary

## Overview

A comprehensive identity verification system has been implemented for the Revendiste platform to prevent fraud and ensure that sellers are legitimate users. The system uses AWS Rekognition for document verification, face comparison, and liveness detection, with Cloudflare R2 for secure document storage.

## What Was Implemented

### 1. Database Changes ✅

**Migration**: `apps/backend/src/db/migrations/1767908106823_add_identity_verification_fields.ts`

Added the following fields to the `users` table:
- `document_type` (enum: ci_uy, dni_ar, passport)
- `document_number` (varchar)
- `document_country` (varchar, for passports)
- `document_verified` (boolean)
- `verification_status` (enum: pending, completed, requires_manual_review, failed)
- `document_verified_at` (timestamp)
- `verification_session_id` (varchar)
- `verification_confidence_scores` (jsonb)
- `document_image_path` (varchar)
- `selfie_image_path` (varchar)
- `verification_metadata` (jsonb)
- `manual_review_reason` (text)
- `verification_attempts` (integer)

Indexes created:
- `idx_users_document_verified` on `document_verified`
- `idx_users_document_number` unique partial index on verified documents

### 2. Backend Service ✅

**File**: `apps/backend/src/services/identity-verification/index.ts`

Implements the complete verification flow:

- **`initiateVerification()`**: Validates document format and checks for duplicates
  - CI Uruguay: Validates checksum using vector [8,1,2,3,4,7,6]
  - DNI Argentina: Validates 7-8 digit format
  - Passport: Requires country code

- **`processDocumentAndSelfie()`**: 
  - Uploads images to R2 (path: `private/users/{userId}/identity-documents/`)
  - AWS Rekognition DetectText to extract document number
  - AWS Rekognition DetectFaces to validate faces in both images
  - AWS Rekognition CompareFaces with 90% similarity threshold
  - Determines if manual review is needed based on confidence scores

- **`createAndCompleteLivenessCheck()`**:
  - Creates AWS Rekognition Face Liveness session
  - Configures output to R2 bucket

- **`verifyLivenessResults()`**:
  - Retrieves liveness session results
  - Validates liveness confidence (>= 90%)
  - Updates user verification status
  - Handles retry logic (max 3 attempts)

### 3. Backend Controller ✅

**File**: `apps/backend/src/controllers/identity-verification/index.ts`

REST API endpoints:
- `POST /identity-verification/initiate` - Start verification process
- `POST /identity-verification/verify-documents` - Upload document and selfie
- `POST /identity-verification/start-liveness` - Create liveness session
- `POST /identity-verification/verify-liveness` - Complete verification

### 4. Frontend Components ✅

**Files**:
- `apps/frontend/src/features/identity-verification/IdentityVerificationFlow.tsx` - Main verification flow
- `apps/frontend/src/hooks/useIsMobile.ts` - Mobile device detection

Features:
- Multi-step wizard (Info → Documents → Liveness → Complete)
- Document type selection (CI Uruguay, DNI Argentina, Passport)
- File upload for document and selfie
- Mobile-only liveness check (with QR code for desktop users)
- Manual review status handling

### 5. Integration with Ticket Listing ✅

**File**: `apps/backend/src/services/ticket-listings/index.ts`

Added verification check at the beginning of `createTicketListing()`:
- Blocks listing creation if user is not verified
- Returns appropriate error messages based on verification status:
  - `VERIFICATION_REQUIRED` - Not yet verified
  - `VERIFICATION_IN_MANUAL_REVIEW` - Under review
  - `VERIFICATION_FAILED` - Failed verification

### 6. User API Updates ✅

**File**: `apps/backend/src/controllers/users/index.ts`

Updated `/users/me` endpoint to include:
- `documentVerified` (boolean)
- `verificationStatus` (enum)

### 7. Error Messages ✅

**File**: `apps/backend/src/constants/error-messages.ts`

Added comprehensive error messages in Spanish:
- Document validation errors
- Face detection/comparison errors
- Liveness check errors
- Manual review messages

### 8. Documentation ✅

**Files**:
- `apps/backend/docs/identity-verification-aws-iam-setup.md` - AWS IAM and R2 setup guide
- `apps/frontend/src/assets/documents/privacy.md` - Updated privacy policy
- `apps/frontend/src/assets/documents/tos.md` - Updated terms of service

### 9. Dependencies ✅

Installed packages:
- Backend: `@aws-sdk/client-rekognition`
- Frontend: `@aws-amplify/ui-react-liveness`, `aws-amplify`

## Verification Flow

```
1. User initiates verification
   ↓
2. Selects document type and enters number
   ↓
3. Uploads document photo and selfie
   ↓
4. Backend processes:
   - Extract text from document
   - Detect faces
   - Compare faces (90%+ similarity)
   ↓
5. Creates liveness session
   ↓
6. User completes liveness check on mobile
   ↓
7. Backend verifies liveness results (90%+ confidence)
   ↓
8. Status determined:
   - ✅ Completed (can sell tickets)
   - ⏱ Manual Review (admin review needed)
   - ❌ Failed (retry or contact support)
```

## Three-State Verification System

1. **Completed** (`documentVerified: true, status: completed`)
   - All checks passed with high confidence
   - User can immediately list tickets

2. **Requires Manual Review** (`documentVerified: false, status: requires_manual_review`)
   - Borderline confidence scores (90-95%)
   - Poor image quality
   - Multiple failed attempts
   - Admin review needed within 24-48 hours

3. **Failed** (`documentVerified: false, status: failed`)
   - Liveness check failed
   - Face mismatch
   - Invalid document
   - Can retry (max 3 attempts)

## Manual Review Workflow

When verification requires manual review:

1. User is notified: "Tu verificación está siendo revisada. Te notificaremos en 24-48 horas"
2. Admin can access pending verifications (future admin UI)
3. Admin reviews:
   - Document images (via signed R2 URLs)
   - Selfie image
   - Confidence scores
   - Manual review reason
4. Admin actions:
   - Approve → Sets `documentVerified: true`
   - Reject → Sets `verificationStatus: failed`
   - Request more info → Notifies user

## Security Features

### Encryption
- **At Rest**: Cloudflare R2 automatically encrypts all objects with AES-256-GCM
- **In Transit**: TLS 1.3+ for all data transmission

### Storage
- Private R2 bucket for identity documents
- Path: `/private/users/{userId}/identity-documents/`
- Signed URLs with 15-minute expiration for access

### Document Uniqueness
- Unique index prevents same document from verifying multiple accounts
- Prevents identity fraud and duplicate accounts

### Audit Trail
- All verification attempts logged
- Confidence scores stored
- Liveness session metadata retained
- Manual review reasons tracked

### Data Retention
- Identity documents: 5 years (compliance)
- Liveness biometric data: Deleted immediately after verification
- Verification metadata: Retained as audit trail

## Cost Estimates

### Per Verification
- Text Detection: $0.001
- Face Detection: $0.002 (2 images)
- Face Comparison: $0.001
- Face Liveness: $0.100
- **Total**: ~$0.104 per verification

With $1,000 AWS credits: ~9,600 verifications

### R2 Storage
- ~1-2 MB per verification (2 images)
- $0.015 per GB/month
- Negligible cost for 10,000 verifications (~$0.30/month)

## Next Steps

### To Deploy:

1. **AWS Configuration**
   - Create IAM user with Rekognition permissions
   - Add AWS credentials to environment variables
   - See: `apps/backend/docs/identity-verification-aws-iam-setup.md`

2. **R2 Configuration**
   - Create R2 buckets (public and private)
   - Generate R2 API tokens
   - Configure CORS
   - Add R2 credentials to environment variables

3. **Environment Variables**
   ```bash
   # AWS Rekognition
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=xxx
   AWS_SECRET_ACCESS_KEY=xxx
   
   # Cloudflare R2
   R2_PUBLIC_BUCKET=revendiste-public
   R2_PRIVATE_BUCKET=revendiste-private
   R2_ACCOUNT_ID=xxx
   R2_ACCESS_KEY_ID=xxx
   R2_SECRET_ACCESS_KEY=xxx
   ```

4. **Frontend API Types**
   - Run `pnpm generate:api` in frontend to update API types

5. **Testing**
   - Test with real CI Uruguay document
   - Test liveness check on mobile device
   - Verify complete flow end-to-end

### Optional Enhancements:

1. **Admin UI** (not implemented)
   - Dashboard for pending reviews
   - View document images
   - Approve/reject verifications

2. **AWS Rekognition Custom Labels** (optional)
   - Train model on CI Uruguay documents if text detection accuracy needs improvement
   - Cost: ~$1/hour + $0.005 per inference

3. **Testing** (not implemented)
   - Unit tests for service methods
   - Integration tests for full flow
   - Mock AWS services for tests

4. **Monitoring** (not implemented)
   - CloudWatch alarms for API errors
   - Cost tracking dashboard
   - Verification success/failure metrics

## Important Notes

### CI Uruguay Checksum Validation

The system implements the official CI Uruguay validation algorithm:
- Takes first 7 digits
- Multiplies by validation vector: [8,1,2,3,4,7,6]
- Sums results and takes modulo 10
- Compares with 8th digit (check digit)

Example:
```
CI: 1.234.567-2
Base: 1234567
Calculation: (1×8) + (2×1) + (3×2) + (4×3) + (5×4) + (6×7) + (7×6) = 132
Check: 132 % 10 = 2 ✓
```

### DNI Argentina

No public validation algorithm exists. System validates:
- Format: 7 or 8 digits
- Text extraction from OCR
- Face matching

### Liveness Detection

AWS Rekognition Face Liveness detects:
- Live person vs. photo/video replay
- 3D mask detection
- Anti-spoofing checks
- Requires mobile device with camera

## Files Modified/Created

### Backend
- ✅ `apps/backend/src/db/migrations/1767908106823_add_identity_verification_fields.ts`
- ✅ `apps/backend/src/services/identity-verification/index.ts`
- ✅ `apps/backend/src/controllers/identity-verification/index.ts`
- ✅ `apps/backend/src/controllers/identity-verification/validation.ts`
- ✅ `apps/backend/src/controllers/index.ts`
- ✅ `apps/backend/src/repositories/users/index.ts`
- ✅ `apps/backend/src/services/ticket-listings/index.ts`
- ✅ `apps/backend/src/controllers/users/index.ts`
- ✅ `apps/backend/src/constants/error-messages.ts`
- ✅ `apps/backend/docs/identity-verification-aws-iam-setup.md`

### Frontend
- ✅ `apps/frontend/src/features/identity-verification/index.ts`
- ✅ `apps/frontend/src/features/identity-verification/IdentityVerificationFlow.tsx`
- ✅ `apps/frontend/src/hooks/useIsMobile.ts`
- ✅ `apps/frontend/src/assets/documents/privacy.md` (already updated)
- ✅ `apps/frontend/src/assets/documents/tos.md` (already updated)

### Database
- ✅ Ran migration
- ✅ Regenerated database types

## Compliance

### Privacy Policy
- ✅ Updated to include identity verification data collection
- ✅ Documented biometric data processing
- ✅ Specified data retention periods
- ✅ Mentioned Cloudflare R2 encryption

### Terms of Service
- ✅ Section 5: Mandatory verification for sellers
- ✅ Document requirements (CI, DNI, Passport)
- ✅ Liveness verification requirement
- ✅ Three verification states explained
- ✅ Fraud consequences detailed
- ✅ Data storage and usage described

## Summary

The identity verification system is fully implemented and ready for deployment. All core features are complete:

✅ Database schema and migrations  
✅ Backend service with AWS Rekognition integration  
✅ REST API endpoints  
✅ Frontend verification flow  
✅ Integration with ticket listing  
✅ Error handling and Spanish messages  
✅ Privacy policy and terms of service updated  
✅ AWS IAM setup documentation  

The system provides:
- **Fraud prevention** through document and face verification
- **Duplicate account prevention** via unique document index
- **Manual review workflow** for borderline cases
- **Secure storage** with encrypted R2 buckets
- **Audit trail** for compliance
- **Cost-effective** at ~$0.10 per verification

Next step: Configure AWS credentials and R2 buckets, then test the complete flow!
