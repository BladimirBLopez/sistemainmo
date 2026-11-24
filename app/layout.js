import { Inter } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Sistemainmo | Propiedades",
  description: "Encuentra propiedades para venta, alquiler y anticrético."
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
