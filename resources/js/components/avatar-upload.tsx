import { useState, useRef, useCallback } from 'react';
import { Camera, X, Upload, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';

type AvatarUploadProps = {
  currentAvatar?: string | null;
  userName: string;
  value?: File | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  error?: string;
  disabled?: boolean;
  maxSizeMB?: number;
  maxWidth?: number;
  maxHeight?: number;
};

const MAX_SIZE_DEFAULT = 2 * 1024 * 1024; // 2MB
const MAX_DIMENSION_DEFAULT = 2000; // 2000px

export function AvatarUpload({
  currentAvatar,
  userName,
  value,
  onChange,
  onRemove,
  error,
  disabled = false,
  maxSizeMB = 2,
  maxWidth = MAX_DIMENSION_DEFAULT,
  maxHeight = MAX_DIMENSION_DEFAULT,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return 'Please upload a valid image file (JPG, PNG, GIF, or WEBP)';
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSizeMB}MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
    }

    return null;
  }, [maxSizeBytes, maxSizeMB]);

  const handleFileSelect = useCallback(async (file: File) => {
    setUploadError(null);
    setIsLoading(true);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      setIsLoading(false);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      setFileInfo({
        name: file.name,
        size: file.size,
      });
      onChange(file);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setUploadError('Failed to read file. Please try again.');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  }, [validateFile, onChange]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    } else {
      setUploadError('Please drop a valid image file');
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setFileInfo(null);
    setUploadError(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onRemove) {
      onRemove();
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const displayAvatar = preview || currentAvatar;
  const hasAvatar = !!displayAvatar;
  const showError = error || uploadError;

  return (
    <div className="space-y-4">
      {/* Avatar Preview Section */}
      <div className="flex flex-col items-center gap-4">
        {/* Large Avatar Display */}
        <div className="relative group">
          <div className={cn(
            "relative rounded-full overflow-hidden transition-all duration-300",
            "ring-2 ring-offset-2 ring-offset-background",
            hasAvatar ? "ring-primary/20" : "ring-muted",
            isDragging && "ring-primary ring-4 scale-105",
            disabled && "opacity-50 cursor-not-allowed"
          )}>
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={userName}
                className="w-32 h-32 object-cover"
              />
            ) : (
              <div className="w-32 h-32 bg-muted flex items-center justify-center">
                <UserAvatar user={{ name: userName }} size="xl" showTooltip={false} />
              </div>
            )}
            
            {/* Overlay on hover */}
            {!disabled && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
              </div>
            )}
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}

          {/* Success indicator */}
          {value && !isLoading && !showError && (
            <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-1 shadow-lg">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        {/* File Info */}
        {fileInfo && (
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground">{fileInfo.name}</p>
            <p className="text-xs text-muted-foreground">
              {(fileInfo.size / 1024).toFixed(1)} KB
            </p>
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-all duration-200",
          isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground/25",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer hover:border-primary/50 hover:bg-muted/50"
        )}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-3 text-center">
          {isDragging ? (
            <>
              <Upload className="h-8 w-8 text-primary animate-bounce" />
              <p className="text-sm font-medium text-primary">Drop image here</p>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-muted">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {hasAvatar ? 'Change photo' : 'Upload photo'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag and drop or click to browse
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                <span>JPG, PNG, GIF, WEBP</span>
                <span>•</span>
                <span>Max {maxSizeMB}MB</span>
                <span>•</span>
                <span>Max {maxWidth}×{maxHeight}px</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={disabled || isLoading}
          className="flex-1 sm:flex-initial"
        >
          <Camera className="h-4 w-4 mr-2" />
          {hasAvatar ? 'Change Photo' : 'Select Photo'}
        </Button>

        {hasAvatar && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={disabled || isLoading}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      {/* Error Display */}
      {showError && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{showError}</AlertDescription>
        </Alert>
      )}

      {/* Help Text */}
      {!showError && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground text-center">
            Recommended: Square image, at least 200×200px for best quality
          </p>
          {fileInfo && (
            <p className="text-xs text-muted-foreground text-center">
              File will be uploaded when you save your profile
            </p>
          )}
        </div>
      )}
    </div>
  );
}

