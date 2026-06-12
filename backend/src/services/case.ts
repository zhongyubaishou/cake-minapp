import prisma from '../utils/prisma';
import { BusinessError } from '../utils/errors';
import { normalizePagination } from '../utils/pagination';

interface CasePayload {
  imageUrl?: string;
  name: string;
  theme?: string;
  referencePound?: number | null;
  referencePrice?: number | null;
  isShown?: number;
  sortOrder?: number;
}

export class CaseService {
  async listPublic(params: { theme?: string; page?: number; pageSize?: number }) {
    const { theme } = params;
    const { page, pageSize, skip } = normalizePagination(params, { defaultPageSize: 10, maxPageSize: 50 });
    const where: Record<string, unknown> = { isShown: 1 };
    if (theme) where.theme = theme;

    const [list, total] = await Promise.all([
      prisma.cakeCase.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.cakeCase.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  async detailPublic(id: number, userId?: number) {
    const cakeCase = await prisma.cakeCase.findFirst({ where: { id, isShown: 1 } });
    if (!cakeCase) throw new BusinessError(404, '案例不存在');

    const favorite = userId
      ? await prisma.userFavorite.findUnique({ where: { userId_caseId: { userId, caseId: id } } })
      : null;

    return { ...cakeCase, isFavorited: Boolean(favorite) };
  }

  async favorite(userId: number, caseId: number) {
    const cakeCase = await prisma.cakeCase.findFirst({ where: { id: caseId, isShown: 1 } });
    if (!cakeCase) throw new BusinessError(404, '案例不存在');

    await prisma.userFavorite.upsert({
      where: { userId_caseId: { userId, caseId } },
      update: {},
      create: { userId, caseId },
    });

    return { isFavorited: true };
  }

  async unfavorite(userId: number, caseId: number) {
    await prisma.userFavorite.deleteMany({ where: { userId, caseId } });
    return { isFavorited: false };
  }

  async listFavorites(userId: number, params: { page?: number; pageSize?: number }) {
    const { page, pageSize, skip } = normalizePagination(params, { defaultPageSize: 10, maxPageSize: 50 });
    const where = { userId };

    const [rows, total] = await Promise.all([
      prisma.userFavorite.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { cakeCase: true },
      }),
      prisma.userFavorite.count({ where }),
    ]);

    return { list: rows.map((row) => row.cakeCase), total, page, pageSize };
  }

  async listAll(params: { theme?: string; isShown?: string; keyword?: string; page?: number; pageSize?: number }) {
    const { theme, isShown, keyword } = params;
    const { page, pageSize, skip } = normalizePagination(params, { defaultPageSize: 20, maxPageSize: 100 });
    const where: any = {};
    if (theme) where.theme = theme;
    if (isShown !== undefined && isShown !== '') where.isShown = Number(isShown);
    if (keyword) where.name = { contains: keyword };

    const [list, total] = await Promise.all([
      prisma.cakeCase.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.cakeCase.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  async create(data: CasePayload) {
    this.assertCanShow(data.imageUrl, data.isShown ?? 1);

    return prisma.cakeCase.create({
      data: {
        imageUrl: data.imageUrl || null,
        name: data.name,
        theme: data.theme || null,
        referencePound: data.referencePound ?? null,
        referencePrice: data.referencePrice ?? null,
        isShown: data.isShown ?? 1,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async update(id: number, data: Partial<CasePayload>) {
    const old = await prisma.cakeCase.findUnique({ where: { id } });
    if (!old) throw new BusinessError(404, '案例不存在');
    this.assertCanShow(data.imageUrl ?? old.imageUrl ?? undefined, data.isShown ?? old.isShown);

    return prisma.cakeCase.update({ where: { id }, data });
  }

  async delete(id: number) {
    const cakeCase = await prisma.cakeCase.findUnique({ where: { id } });
    if (!cakeCase) throw new BusinessError(404, '案例不存在');
    return prisma.cakeCase.delete({ where: { id } });
  }

  async show(id: number) {
    const cakeCase = await prisma.cakeCase.findUnique({ where: { id } });
    if (!cakeCase) throw new BusinessError(404, '案例不存在');
    this.assertCanShow(cakeCase.imageUrl ?? undefined, 1);
    return prisma.cakeCase.update({ where: { id }, data: { isShown: 1 } });
  }

  async hide(id: number) {
    return prisma.cakeCase.update({ where: { id }, data: { isShown: 0 } });
  }

  private assertCanShow(imageUrl: string | undefined, isShown: number) {
    if (isShown === 1 && !imageUrl) {
      throw new BusinessError(400, '请先上传案例图片');
    }
  }
}

export const caseService = new CaseService();
