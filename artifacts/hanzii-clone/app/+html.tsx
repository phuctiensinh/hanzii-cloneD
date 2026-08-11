import { type PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* SEO Meta Tags */}
        <title>Hanzii Clone - Học tiếng Trung HSK & Từ điển Trung Việt</title>
        <meta name="description" content="Ứng dụng học tiếng Trung HSK, tra từ điển Trung-Việt, lưu từ vựng và đồng bộ dữ liệu đám mây thông minh." />
        <meta name="keywords" content="học tiếng trung, hsk, từ điển trung việt, hanzii, hanzii clone, tra từ chữ hán" />

        {/* Open Graph Meta Tags (Zalo, Messenger, Facebook, Telegram) */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://hanzii-clone-brown.vercel.app" />
        <meta property="og:title" content="Hanzii Clone - Học tiếng Trung HSK & Từ điển Trung Việt" />
        <meta property="og:description" content="Ứng dụng học tiếng Trung HSK, tra từ điển Trung-Việt, lưu từ vựng và đồng bộ dữ liệu đám mây thông minh." />
        <meta property="og:image" content="https://hanzii-clone-brown.vercel.app/favicon.ico" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Hanzii Clone - Học tiếng Trung HSK & Từ điển Trung Việt" />
        <meta name="twitter:description" content="Ứng dụng học tiếng Trung HSK, tra từ điển Trung-Việt, lưu từ vựng và đồng bộ dữ liệu đám mây thông minh." />
        <meta name="twitter:image" content="https://hanzii-clone-brown.vercel.app/favicon.ico" />

        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
