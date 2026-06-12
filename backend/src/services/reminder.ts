import prisma from '../utils/prisma';

const defaultSettings = {
  orderConfirmNotice: true,
  paidNotice: false,
  productionNotice: true,
  pickupNotice: true,
  deliveryNotice: true,
  completeNotice: true,
  refundNotice: false,
  newOrderSound: true,
  paidSound: false,
  refundSound: false,
  afterSaleSound: true,
  appointmentSound: true,
};

type ReminderSettings = typeof defaultSettings;

type ReminderSettingRow = {
  orderConfirmNotice: number;
  paidNotice: number;
  productionNotice: number;
  pickupNotice: number;
  deliveryNotice: number;
  completeNotice: number;
  refundNotice: number;
  newOrderSound: number;
  paidSound: number;
  refundSound: number;
  afterSaleSound: number;
  appointmentSound: number;
};

export class ReminderService {
  async getSettings() {
    const row = await this.ensureRow();
    return this.toResponse(row);
  }

  async updateSettings(data: Partial<ReminderSettings>) {
    const current = await this.getSettings();
    const merged = { ...current, ...data };
    const payload = this.toPersistedData(merged);
    const existing = await prisma.reminderSetting.findFirst();
    const row = existing
      ? await prisma.reminderSetting.update({ where: { id: existing.id }, data: payload })
      : await prisma.reminderSetting.create({ data: { ...payload, id: 1 } });
    return this.toResponse(row);
  }

  private async ensureRow() {
    const existing = await prisma.reminderSetting.findFirst();
    if (existing) return existing;
    return prisma.reminderSetting.create({ data: { ...this.toPersistedData(defaultSettings), id: 1 } });
  }

  private toPersistedData(data: ReminderSettings) {
    return {
      orderConfirmNotice: data.orderConfirmNotice ? 1 : 0,
      paidNotice: data.paidNotice ? 1 : 0,
      productionNotice: data.productionNotice ? 1 : 0,
      pickupNotice: data.pickupNotice ? 1 : 0,
      deliveryNotice: data.deliveryNotice ? 1 : 0,
      completeNotice: data.completeNotice ? 1 : 0,
      refundNotice: data.refundNotice ? 1 : 0,
      newOrderSound: data.newOrderSound ? 1 : 0,
      paidSound: data.paidSound ? 1 : 0,
      refundSound: data.refundSound ? 1 : 0,
      afterSaleSound: data.afterSaleSound ? 1 : 0,
      appointmentSound: data.appointmentSound ? 1 : 0,
    };
  }

  private toResponse(row: ReminderSettingRow): ReminderSettings {
    return {
      orderConfirmNotice: Boolean(row.orderConfirmNotice),
      paidNotice: Boolean(row.paidNotice),
      productionNotice: Boolean(row.productionNotice),
      pickupNotice: Boolean(row.pickupNotice),
      deliveryNotice: Boolean(row.deliveryNotice),
      completeNotice: Boolean(row.completeNotice),
      refundNotice: Boolean(row.refundNotice),
      newOrderSound: Boolean(row.newOrderSound),
      paidSound: Boolean(row.paidSound),
      refundSound: Boolean(row.refundSound),
      afterSaleSound: Boolean(row.afterSaleSound),
      appointmentSound: Boolean(row.appointmentSound),
    };
  }
}

export const reminderService = new ReminderService();
