import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const css = `
html, body, #root {
  height: 100%;
  min-height: 100dvh;
  background: #F4F5F8;
}
body {
  margin: 0;
  overscroll-behavior: none;
  -webkit-text-size-adjust: 100%;
}
input, textarea, [data-allow-select="true"] {
  -webkit-user-select: text;
  user-select: text;
}
`;

export default function Root({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();

  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#F8F9FA" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1A1C2E" media="(prefers-color-scheme: dark)" />
        <meta
          name="description"
          content="Study the Word. Enjoy the Journey. A Christian youth card game."
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Wayfare" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.png" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: css }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
