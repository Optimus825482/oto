import type { ReactNode } from "react";
import SupplierShell from "@/components/supplier/SupplierShell";

export default function TedarikciLayout({ children }: { children: ReactNode }) {
  return <SupplierShell>{children}</SupplierShell>;
}
