# Cloudinary Integration for KYC Document Upload

This guide explains how to set up and use Cloudinary for securely uploading and managing KYC (Know Your Customer) documents in the PesaHari app.

## Overview

The app now uses **Cloudinary** instead of Firebase Storage for KYC document uploads. This provides:
- Robust image processing and optimization
- Secure cloud storage with global CDN
- Easy asset management and versioning
- Better performance for image delivery

## Setup Steps

### 1. Create a Cloudinary Account

1. Go to [Cloudinary.com](https://cloudinary.com)
2. Sign up for a free account (free tier includes 25GB storage)
3. Log in to your dashboard

### 2. Get Your Cloudinary Credentials

In your Cloudinary Dashboard:

1. **Cloud Name**: Found at the top of your dashboard (Settings → Account)
   - Format: `your_cloud_name`

2. **Upload Preset**: Create an unsigned upload preset for web usage
   - Go to Settings → Upload
   - Scroll to "Upload presets"
   - Click "Add upload preset"
   - Set:
     - **Name**: `pesahari_kyc` (or your choice)
     - **Signing Mode**: `Unsigned` (for client-side uploads)
     - **Folder**: `pesahari/kyc` (optional, for organization)
   - Click "Save"

3. **API Key & API Secret** (Optional, for server-side operations)
   - Go to Settings → Account
   - Find "API Key" and "API Secret"
   - Keep these secure and never expose in client-side code

### 3. Configure Environment Variables

Add your Cloudinary credentials to `.env`:

```env
# Cloudinary Configuration for document uploads
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=pesahari_kyc
```

**Important:** 
- These are client-side variables (prefixed with `VITE_`)
- They are safe to expose since the upload preset is unsigned
- Keep `VITE_CLOUDINARY_API_KEY` and `VITE_CLOUDINARY_API_SECRET` secure and only use them on the backend

## How It Works

### Upload Flow

1. User selects ID photos (front & back) in the onboarding flow (Step 5)
2. App validates file types and sizes
3. Files are uploaded directly to Cloudinary via the upload API
4. Cloudinary returns a secure URL for each file
5. URLs are stored in Firestore for later retrieval
6. User data is saved with references to the Cloudinary images

### File Organization

KYC documents are organized in Cloudinary with the following structure:
```
pesahari/kyc/{user_id}/id_front_[timestamp]_[filename]
pesahari/kyc/{user_id}/id_back_[timestamp]_[filename]
```

## Code Integration

### Using the Cloudinary Utility

The app includes a utility module at `src/lib/cloudinary.ts` with helper functions:

```typescript
// Upload a single file
import { uploadToCloudinary } from './lib/cloudinary';

const fileUrl = await uploadToCloudinary(file, 'pesahari/kyc/user123');
```

```typescript
// Upload multiple files
import { uploadMultipleToCloudinary } from './lib/cloudinary';

const urls = await uploadMultipleToCloudinary(
  [frontFile, backFile],
  'pesahari/kyc/user123'
);
```

### Error Handling

The utility includes proper error handling:
- Missing environment variables
- Network failures
- Invalid file types
- Upload failures

Example:
```typescript
try {
  const url = await uploadToCloudinary(file);
} catch (error) {
  console.error('Upload failed:', error);
  // Display user-friendly error message
}
```

## Firestore Integration

KYC verification data is now stored with Cloudinary URLs:

```javascript
idVerification: {
  front: "https://res.cloudinary.com/...",
  back: "https://res.cloudinary.com/...",
  method: "CLOUDINARY_UPLOAD",
  uploadedAt: Timestamp,
  storageProvider: "CLOUDINARY"
}
```

## Security Best Practices

1. **Never commit credentials** to git
2. **Use unsigned presets** for client-side uploads
3. **Keep API secret private** - only use on backend
4. **Validate file types** before upload (already done in the app)
5. **Use HTTPS** always
6. **Set folder permissions** in your upload preset if needed

## Troubleshooting

### "Cloudinary configuration missing" error

**Cause**: Environment variables not set

**Solution**: 
1. Verify `.env` file exists in project root
2. Check that `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` are set
3. Restart the development server

```bash
npm run dev
```

### Upload fails with 401 error

**Cause**: Invalid upload preset or cloud name

**Solution**:
1. Verify preset exists in Cloudinary dashboard
2. Ensure preset is set to "Unsigned"
3. Check cloud name spelling and case-sensitivity

### Files not showing in Cloudinary dashboard

**Cause**: Correct folder path not configured

**Solution**:
1. Check the folder structure in Cloudinary Media Library
2. Verify the folder path matches your upload preset configuration
3. Files may be in a different folder than expected

### Performance issues

**Optimization tips**:
- Cloudinary automatically optimizes images
- Use the `secure_url` returned by the API (includes optimization)
- Cloudinary's CDN ensures fast delivery globally
- Consider implementing image transformation for thumbnails

## Testing the Integration

### Manual Testing

1. Start the app in development mode:
   ```bash
   npm run dev
   ```

2. Go through onboarding and reach Step 5 (ID Verification)

3. Upload test ID images (front and back)

4. Check Cloudinary dashboard to verify files are uploaded

5. Verify Firestore contains the URLs

### Testing Locally

If developing without Cloudinary credentials:
1. Create mock upload function in dev environment
2. Return placeholder URLs for testing
3. This allows UI/UX testing without cloud setup

## Migration from Firebase Storage

If you had existing documents in Firebase Storage:

1. Download existing files from Firebase Storage
2. Use bulk upload to Cloudinary via dashboard or API
3. Update Firestore records with new Cloudinary URLs
4. Verify all documents are accessible

## Additional Resources

- [Cloudinary Dashboard](https://cloudinary.com/console)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Upload API Reference](https://cloudinary.com/documentation/image_upload_api_reference)
- [Upload Widget Guide](https://cloudinary.com/documentation/upload_widget)

## Support

For issues or questions:
- Check Cloudinary documentation
- Review error logs in browser console
- Verify environment variables are set correctly
- Contact Cloudinary support if cloud service is the issue
