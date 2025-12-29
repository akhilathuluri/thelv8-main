# Image Upload Feature

## Overview
Modular image upload system that allows admins to upload product images directly to Supabase Storage instead of manually entering URLs.

## Files Created

### 1. **services/storage.service.ts**
Core service for handling Supabase Storage operations:
- `uploadImage()` - Upload single image
- `uploadMultipleImages()` - Upload multiple images at once
- `deleteImage()` - Delete image from storage
- `getPublicUrl()` - Get public URL for stored images
- Automatic validation (file type, size limit 5MB)
- Unique filename generation

### 2. **components/admin/ImageUpload.tsx**
Single image upload component with:
- Drag & drop file upload
- URL input fallback option
- Image preview
- Delete functionality
- Upload progress indicator

### 3. **components/admin/MultiImageUpload.tsx**
Multiple image upload component with:
- Upload multiple images at once
- Drag & drop support
- Grid view of uploaded images
- First image marked as "Main"
- URL input fallback
- Max image limit (default: 10)
- Individual image deletion

## Usage in Admin Products Page

### Before:
```tsx
<input type="url" value={imageUrl} onChange={...} />
```

### After:
```tsx
<MultiImageUpload
  values={[mainImage, ...additionalImages]}
  onChange={(urls) => {
    const [main, ...others] = urls;
    setMainImage(main);
    setAdditionalImages(others);
  }}
  maxImages={10}
  folder="products"
/>
```

## Features

✅ **Drag & drop** file upload
✅ **Multiple files** at once
✅ **Image preview** before saving
✅ **URL fallback** (can still paste URLs)
✅ **5MB size limit** per image
✅ **Automatic validation** (file type, size)
✅ **Supabase Storage** integration
✅ **Public URLs** generated automatically
✅ **Delete functionality**
✅ **Progress indicators**

## Storage Structure

Images are stored in Supabase Storage:
- **Bucket**: `products`
- **Folder**: `products/` (optional subfolder)
- **Naming**: `{timestamp}-{random}.{extension}`
- **Example**: `1703678901234-abc123.jpg`

## Permissions

Already configured in `schema.sql`:
- ✅ Public read access for all images
- ✅ Admin-only upload/delete permissions
- ✅ Row Level Security enabled

## Benefits

1. **No external image hosting needed**
2. **Faster workflow** - no need to upload elsewhere first
3. **Better UX** - visual feedback during upload
4. **Fallback option** - can still paste URLs when needed
5. **Modular** - easy to reuse in other admin pages
6. **Future-proof** - can add features like image cropping, compression, etc.

## Future Enhancements (Optional)

- Image cropping/editing before upload
- Bulk upload from ZIP file
- Image optimization/compression
- CDN integration
- Image versioning
- Alt text management
- Drag to reorder images

## No Breaking Changes

- ✅ Existing URL input still works
- ✅ All current products remain functional
- ✅ Database schema unchanged
- ✅ Core functionality preserved
- ✅ Completely backward compatible
