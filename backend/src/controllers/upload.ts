import { Context } from 'koa';
import { success, BusinessError } from '../utils';
import prisma from '../utils/prisma';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads');
const TMP_DIR = path.join(UPLOAD_DIR, 'tmp');

// 允许的文件类型及其魔数签名
const ALLOWED_TYPES: Record<string, { magic: number[]; mime: string }> = {
  '.jpg':  { magic: [0xFF, 0xD8, 0xFF], mime: 'image/jpeg' },
  '.jpeg': { magic: [0xFF, 0xD8, 0xFF], mime: 'image/jpeg' },
  '.png':  { magic: [0x89, 0x50, 0x4E, 0x47], mime: 'image/png' },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// 确保上传目录存在
for (const dir of [UPLOAD_DIR, TMP_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getFile(ctx: Context): any {
  const files = (ctx.request as any).files;
  if (!files) return null;
  // koa-body 将文件放在 { fieldname: File | File[] } 结构中
  const file = files.file;
  if (!file) return Object.values(files)[0]; // 兜底取任意字段
  return Array.isArray(file) ? file[0] : file;
}

export class UploadController {
  /** POST /api/upload（用户端） */
  async uploadUser(ctx: Context) {
    const file = getFile(ctx);
    if (!file) throw new BusinessError(400, '未选择文件');
    const bizType = (ctx.request.body as any)?.bizType || 'ORDER_REF';
    const result = await this.saveFile(file, bizType, 'USER', ctx.state.userId);
    success(ctx, result);
  }

  /** POST /admin/upload（后台） */
  async uploadAdmin(ctx: Context) {
    const file = getFile(ctx);
    if (!file) throw new BusinessError(400, '未选择文件');
    const bizType = (ctx.request.body as any)?.bizType || 'PRODUCT';
    const result = await this.saveFile(file, bizType, 'ADMIN', ctx.state.adminUserId);
    success(ctx, result);
  }

  private async saveFile(
    file: any,
    bizType: string,
    uploaderType: 'USER' | 'ADMIN',
    uploaderId: number,
  ) {
    const originalName = file.originalFilename || file.originalname || file.newFilename || 'file';
    const ext = path.extname(originalName).toLowerCase();

    // 1. 扩展名白名单校验
    if (!ALLOWED_TYPES[ext]) {
      throw new BusinessError(400, '仅支持 jpg/png/jpeg 格式的图片');
    }

    // 2. 文件大小校验
    const srcPath = file.filepath || file.path;
    const stat = fs.statSync(srcPath);
    if (stat.size > MAX_FILE_SIZE) {
      throw new BusinessError(400, '文件大小不能超过 10MB');
    }

    // 3. 文件魔数校验（防伪造扩展名）
    const magic = ALLOWED_TYPES[ext].magic;
    const buf = Buffer.alloc(magic.length);
    const fd = fs.openSync(srcPath, 'r');
    fs.readSync(fd, buf, 0, magic.length, 0);
    fs.closeSync(fd);
    for (let i = 0; i < magic.length; i++) {
      if (buf[i] !== magic[i]) {
        throw new BusinessError(400, '文件内容与扩展名不匹配，请上传合法的图片文件');
      }
    }

    const fileName = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // koa-body + formidable：文件对象带有 filepath 属性
    fs.copyFileSync(srcPath, filePath);

    const fileUrl = `/uploads/${fileName}`;

    const record = await prisma.uploadFile.create({
      data: {
        fileUrl,
        fileKey: `uploads/${fileName}`,
        fileType: `image/${ext.slice(1) || 'png'}`,
        bizType: bizType as any,
        uploaderType: uploaderType as any,
        uploaderId,
      },
    });

    return { fileId: record.id, fileUrl, fileKey: record.fileKey };
  }
}

export const uploadController = new UploadController();
