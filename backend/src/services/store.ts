import prisma from '../utils/prisma';

export class StoreService {
  /** 获取门店配置（仅一条记录） */
  async getConfig() {
    let config = await prisma.storeConfig.findFirst();
    if (!config) {
      config = await prisma.storeConfig.create({
        data: {
          name: '蛋糕定制店',
          address: '广东省河源市紫金县义容镇青溪信用社旁',
          lng: 114.87,
          lat: 23.69,
          businessHoursStart: '06:00:00',
          businessHoursEnd: '18:00:00',
          deliveryRangeKm: 5.0,
          deliveryFeePerKm: 2.0,
          minAdvanceHours: 6,
          pricePerPound: 0.00,
        },
      });
    }
    return config;
  }

  /** 更新门店配置 */
  async updateConfig(data: {
    name?: string;
    address?: string;
    lng?: number;
    lat?: number;
    businessHoursStart?: string;
    businessHoursEnd?: string;
    deliveryRangeKm?: number;
    deliveryFeePerKm?: number;
    minAdvanceHours?: number;
    dailyOrderLimit?: number | null;
    pricePerPound?: number;
    qrCodeUrl?: string;
  }) {
    const config = await this.getConfig();
    return prisma.storeConfig.update({
      where: { id: config.id },
      data,
    });
  }
}

export const storeService = new StoreService();
