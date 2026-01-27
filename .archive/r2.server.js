/**
 * Cloudflare R2 簽名服務 (Server-only)
 * 使用 AWS SDK S3 相容模式
 */
export class R2Service {
    constructor() {
        this.bucketName = process.env.R2_BUCKET_NAME;
    }
    // 生成簽名 URL 以供安全瀏覽
    async getSignedViewUrl(fileKey) {
        console.log(`[R2] 生成 1 小時有效簽名連結: ${fileKey}`);
        // 實際會呼叫 getSignedUrl(s3, command, { expiresIn: 3600 })
        return `https://pub-r2.chronos.dev/${fileKey}?X-Amz-Signature=...`;
    }
    // 生成上傳簽名
    async getPresignedUploadUrl(fileName) {
        const key = `uploads/${Date.now()}-${fileName}`;
        console.log(`[R2] 生成上傳授權: ${key}`);
        return {
            url: "https://r2-upload.chronos.dev",
            fields: { "Key": key, "Content-Type": "image/png" },
            key
        };
    }
}
export const r2 = new R2Service();
