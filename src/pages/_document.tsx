import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="he" dir="rtl">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="description" content="Meety - מערכת ניהול פגישות מתקדמת" />
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