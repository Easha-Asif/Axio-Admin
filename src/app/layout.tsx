import { Manrope } from "next/font/google";
import { Toaster } from "react-hot-toast";
// import "@/styles/global.css"; // <--- Add this line
import "@/styles/global.css"

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export default function RootLayout({ children }: any) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1c1c1c',
              color: '#fff',
              border: '1px solid #333',
              fontSize: 12,
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}