import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Menú inicial | Simulador bancario",
  description: "Simulador educativo de operaciones bancarias.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
