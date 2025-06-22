import "./globals.css";
import { StoreProvider } from "@/store/provider";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata = {
    title: 'Mindspeak - uniconfess',
    description: 'A safe space for mental health support and community',
    icons: {
      icon: '/logo8.png',
    },
  }
  
  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <StoreProvider>
              {children}
            </StoreProvider>
          </ThemeProvider>
        </body>
      </html>
    )
  }
  