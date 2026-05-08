/**
 * Cloudinary Upload Utility
 * Handles file uploads to Cloudinary for KYC documents
 */

interface CloudinaryUploadResponse {
  event?: 'success' | 'error';
  info?: {
    secure_url?: string;
    public_id?: string;
    error?: {
      message: string;
    };
  };
}

/**
 * Upload a file to Cloudinary
 * @param file - File to upload
 * @param folder - Cloudinary folder path (e.g., "pesahari/kyc")
 * @returns Promise with the secure URL or throws error
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'pesahari/kyc'
): Promise<string> {
  const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string);
  const uploadPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string);

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);
  formData.append('resource_type', 'auto');

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Cloudinary response error:', response.status, errorData);
      throw new Error(`Upload failed with status ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    console.log('Cloudinary upload success:', data);

    if (!data.secure_url) {
      console.error('No secure_url in response:', data);
      throw new Error('No URL returned from Cloudinary');
    }

    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Upload multiple files to Cloudinary
 * @param files - Array of files to upload
 * @param folder - Cloudinary folder path
 * @returns Promise with array of secure URLs
 */
export async function uploadMultipleToCloudinary(
  files: File[],
  folder: string = 'pesahari/kyc'
): Promise<string[]> {
  const uploadPromises = files.map((file) =>
    uploadToCloudinary(file, folder)
  );

  return Promise.all(uploadPromises);
}

/**
 * Delete a file from Cloudinary
 * @param publicId - Public ID of the file to delete
 * @returns Promise<void>
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string);
  const apiKey = (import.meta.env.VITE_CLOUDINARY_API_KEY as string);
  const apiSecret = (import.meta.env.VITE_CLOUDINARY_API_SECRET as string);

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary API credentials missing for deletion'
    );
  }

  // Note: For security, deletion should be done server-side
  // This is a placeholder - implement proper deletion on your backend
  console.warn(
    'Client-side deletion not recommended. Use server-side deletion with API key.'
  );
}
