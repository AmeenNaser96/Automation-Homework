'use client';

import { useEffect } from 'react';
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';

export default function ChatWidget() {
  useEffect(() => {
    createChat({
      webhookUrl:
        'https://ameen92026.app.n8n.cloud/webhook/8c693f5b-8109-4faf-9c6e-75bc70b98966/chat',
    });
  }, []);

  return <div></div>;
}
