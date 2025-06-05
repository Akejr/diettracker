import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ImageUploadProps {
  userId?: string;
  url?: string;
  size?: number;
  onUpload: (url: string) => void;
}

export function ImageUpload({ userId, url, size = 150, onUpload }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (url) setImageUrl(url);
  }, [url]);

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      setError(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você precisa selecionar uma imagem para fazer upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId ? userId : 'public'}-${Math.random().toString().substring(2, 8)}`;
      const filePath = `${fileName}.${fileExt}`;

      // Verificar se o arquivo é uma imagem
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione um arquivo de imagem válido.');
      }

      // Verificar tamanho do arquivo (limite de 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 2MB.');
      }

      // Fazer upload para o bucket padrão
      let { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Erro de upload:', uploadError);
        throw new Error('Erro ao fazer upload da imagem. Tente novamente.');
      }

      // Obter URL pública da imagem
      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
      
      if (publicUrlData) {
        const imageUrl = publicUrlData.publicUrl;
        setImageUrl(imageUrl);
        onUpload(imageUrl);
      }
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      setError(error instanceof Error ? error.message : 'Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        className="relative rounded-full overflow-hidden border-2 border-[#33333380] bg-[#18181880] flex items-center justify-center shadow-md"
        style={{ width: size, height: size }}
      >
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-1/2 h-1/2 text-[#808080]" />
        )}

        <label 
          htmlFor="single" 
          className="absolute inset-0 w-full h-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-white text-sm font-medium"
        >
          {uploading ? 'Enviando...' : 'Alterar foto'}
        </label>
      </div>

      <input
        style={{ visibility: 'hidden', position: 'absolute' }}
        type="file"
        id="single"
        accept="image/*"
        onChange={uploadAvatar}
        disabled={uploading}
      />

      {error && (
        <div className="flex items-center justify-center gap-2 mt-1">
          <div className="text-[#FF9999] text-xs">{error}</div>
        </div>
      )}
    </div>
  );
}