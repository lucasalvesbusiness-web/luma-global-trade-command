'use client';

import { upload } from '@vercel/blob/client';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type Props = {
  prefix: string;
  accept?: string;
  label?: string;
  onUploaded: (url: string, file: File) => void;
  className?: string;
};

export function BlobUploader({
  prefix,
  accept = 'image/*,application/pdf',
  label = 'Enviar arquivo',
  onUploaded,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setProgress(0);
    setPending(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_');
      const pathname = `${prefix.replace(/^\/+|\/+$/g, '')}/${Date.now()}-${safeName}`;
      const result = await upload(pathname, file, {
        access: 'public',
        handleUploadUrl: '/api/blob/upload',
        onUploadProgress: ({ percentage }) => setProgress(percentage),
      });
      onUploaded(result.url, file);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no upload');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? `Enviando ${progress}%` : label}
      </Button>
      {error && (
        <p className="font-mono text-[10px] text-destructive">{error}</p>
      )}
    </div>
  );
}
