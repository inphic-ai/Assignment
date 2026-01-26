
// 此檔案處理 R2 Bucket 互動
import { Attachment } from '../types';

/**
 * 模擬 Cloudflare R2 簽名 URL 生成
 */
export class StorageService {
  private bucketName = "chronos-assets";

  // 生成簽名 URL (Signed URL)
  // 在 Remix 中，這會在 loader 中執行，然後把 URL 傳給前端 <img> 標籤
  async getSignedUrl(fileKey: string): Promise<string> {
    const expiration = 3600; // 1 小時後過期
    console.log(`[R2] 為檔案 ${fileKey} 生成簽名連結，時效: ${expiration}s`);
    
    // 模擬簽名後的結果
    return `https://r2.chronos.dev/${fileKey}?signature=valid_for_1hr_&expires=12345678`;
  }

  // 處理上傳流程 (Presigned Post)
  async createUploadUrl(fileName: string, contentType: string) {
    console.log(`[R2] 準備接收上傳: ${fileName} (${contentType})`);
    return {
      uploadUrl: "https://r2-api.cloudflare.com/upload-endpoint",
      fileKey: `uploads/${Date.now()}-${fileName}`
    };
  }
}

export const storage = new StorageService();
