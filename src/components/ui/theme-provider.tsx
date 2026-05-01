import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "privipay-theme",
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      defaultTheme={defaultTheme}
      storageKey={storageKey}
      enableSystem={false}
      attribute="class"
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export { useTheme }