import { prisma } from "./db";

export interface SystemSettingsDTO {
  enableCoreExchange: boolean;
  coreDepositAmount: number;
  enableVinProgramming: boolean;
  vinProgrammingFee: number;
  enableB2bDealers: boolean;
  b2bDiscountPercent: number;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingsDTO = {
  enableCoreExchange: true,
  coreDepositAmount: 1500,
  enableVinProgramming: true,
  vinProgrammingFee: 1500,
  enableB2bDealers: true,
  b2bDiscountPercent: 8,
};

export async function getSystemSettings(): Promise<SystemSettingsDTO> {
  try {
    const existing = await prisma.systemSetting.findUnique({
      where: { id: "default" },
    });
    if (!existing) {
      return DEFAULT_SYSTEM_SETTINGS;
    }
    return {
      enableCoreExchange: existing.enableCoreExchange,
      coreDepositAmount: existing.coreDepositAmount,
      enableVinProgramming: existing.enableVinProgramming,
      vinProgrammingFee: existing.vinProgrammingFee,
      enableB2bDealers: existing.enableB2bDealers,
      b2bDiscountPercent: existing.b2bDiscountPercent,
    };
  } catch {
    return DEFAULT_SYSTEM_SETTINGS;
  }
}
