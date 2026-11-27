import type { Metadata } from "next";
import DeviceSessionHeartbeat from "./device-session-heartbeat";
import "./globals.css";

export const metadata: Metadata = {
  title: "Menú inicial | Simulador bancario",
  description: "Simulador educativo de operaciones bancarias.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>
        <DeviceSessionHeartbeat />
        {children}
      </body>
    </html>
  );
}
