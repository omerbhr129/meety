import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="he" dir="rtl">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="description" content="Meety - מערכת ניהול פגישות מתקדמת" />
        
        {/* Favicon */}
        <link 
          rel="icon" 
          type="image/svg+xml" 
          href="/favicon.svg"
          sizes="any"
        />
        <link
          rel="shortcut icon"
          type="image/svg+xml"
          href="/favicon.svg"
        />
        <link
          rel="mask-icon"
          href="/favicon.svg"
          color="#3B82F6"
        />
        <meta name="msapplication-TileColor" content="#3B82F6" />
        <meta name="msapplication-config" content="none" />
        
        {/* PWA */}
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Fonts */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet"
        />
      </Head>
      <body className="font-rubik">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
