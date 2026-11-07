import { useState, useCallback } from 'react';
import { appClient } from '@/integrations/manus/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, X, GripVertical, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageUploadMetadata {
  url: string;
  fingerprint?: string;
  width?: number | null;
  height?: number | null;
  originalName?: string;
  originalBytes?: number;
  processedBytes?: number;
  watermarked?: boolean;
}

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  metadata?: ImageUploadMetadata[];
  onMetadataChange?: (metadata: ImageUploadMetadata[]) => void;
  bucket?: string;
  folder?: string;
  maxImages?: number;
  className?: string;
}

export function MultiImageUpload({
  value = [],
  onChange,
  metadata = [],
  onMetadataChange,
  bucket = 'product-images',
  folder = 'products',
  maxImages = 10,
  className,
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const uploadFiles = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (value.length + validFiles.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];
    const newMetadata: ImageUploadMetadata[] = [];

    try {
      for (const file of validFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploaded, error: uploadError } = await appClient.storage
          .from(bucket)
          .upload(fileName, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;
        if (!uploaded?.publicUrl) throw new Error(`Manus Storage did not return a URL for ${file.name}`);

        newUrls.push(uploaded.publicUrl);
        newMetadata.push({
          url: uploaded.publicUrl,
          fingerprint: uploaded.fingerprint,
          width: uploaded.width,
          height: uploaded.height,
          originalName: uploaded.originalName,
          originalBytes: uploaded.originalBytes,
          processedBytes: uploaded.processedBytes,
          watermarked: uploaded.watermarked,
        });
      }

      onChange([...value, ...newUrls]);
      onMetadataChange?.([...metadata, ...newMetadata]);
      toast.success(`${newUrls.length} image(s) uploaded`);
    } catch (error: unknown) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }, [value]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  };

  const handleRemove = async (index: number) => {
    const url = value[index];
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.findIndex(p => p === bucket);
      if (bucketIndex >= 0) {
        const filePath = pathParts.slice(bucketIndex + 1).join('/');
        await appClient.storage.from(bucket).remove([filePath]);
      }
    } catch (e) {
      // URL parsing failed
    }
    
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
    onMetadataChange?.(metadata.filter((item) => item.url !== url));
  };

  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newUrls = [...value];
    const draggedUrl = newUrls[draggedIndex];
    newUrls.splice(draggedIndex, 1);
    newUrls.splice(index, 0, draggedUrl);
    onChange(newUrls);
    setDraggedIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Image Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {value.map((url, index) => (
            <div
              key={url}
              draggable
              onDragStart={(e) => handleImageDragStart(e, index)}
              onDragOver={(e) => handleImageDragOver(e, index)}
              onDragEnd={handleImageDragEnd}
              className={cn(
                "relative group aspect-square rounded-lg overflow-hidden border bg-muted cursor-move",
                draggedIndex === index && "opacity-50",
                index === 0 && "ring-2 ring-primary"
              )}
            >
              <img
                src={url}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Primary badge */}
              {index === 0 && (
                <span className="absolute top-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                  Primary
                </span>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <div className="p-1 text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleRemove(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {value.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          
          <div className="flex flex-col items-center justify-center text-center">
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium">
                  Add images
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag & drop or click ({value.length}/{maxImages})
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Drag images to reorder. First image is the primary product image. Manus automatically resizes, applies the company watermark and records a fresh upload fingerprint.
      </p>
    </div>
  );
}
