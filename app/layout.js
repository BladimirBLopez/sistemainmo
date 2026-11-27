import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

export const metadata = {
  title: "Sistemainmo | Propiedades",
  description: "Encuentra propiedades para venta, alquiler y anticrético."
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${jakarta.variable} font-sans`}>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
