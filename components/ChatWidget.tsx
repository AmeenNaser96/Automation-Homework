'use client';

import Script from 'next/script';

export default function ChatWidget() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css"
      />
      <Script id="n8n-chat" type="module">
        {`
          import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';
          createChat({
            webhookUrl: 'https://ameen92026.app.n8n.cloud/webhook/8c693f5b-8109-4faf-9c6e-75bc70b98966/chat'
          });
        `}
      </Script>
    </>
  );
}
