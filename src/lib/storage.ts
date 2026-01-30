import { supabase } from './supabase';

// 이미지 업로드
export async function uploadProductImage(file: File, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // 공개 URL 가져오기
  const {
    data: { publicUrl },
  } = supabase.storage.from('product-images').getPublicUrl(data.path);

  return publicUrl;
}

// 이미지 삭제
export async function deleteProductImage(imageUrl: string) {
  // URL에서 파일 경로 추출
  const urlParts = imageUrl.split('/storage/v1/object/public/product-images/');
  if (urlParts.length < 2) return;

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from('product-images')
    .remove([filePath]);

  if (error) throw error;
}

// 여러 이미지 업로드
export async function uploadProductImages(files: File[], userId: string) {
  const uploadPromises = files.map((file) => uploadProductImage(file, userId));
  return Promise.all(uploadPromises);
}
