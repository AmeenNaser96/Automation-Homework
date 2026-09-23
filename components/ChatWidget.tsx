'use client';

import { useEffect } from 'react';
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';

export default function ChatWidget() {
  useEffect(() => {
    createChat({
      webhookUrl:
        'https://ameen92026.app.n8n.cloud/webhook/8c693f5b-8109-4faf-9c6e-75bc70b98966/chat',
      initialMessages: [
        'أهلاً بك 👋',
        'مساعدك لتحليل بيانات شركة مدار للإلكترونيات',
        'كيف يمكنني مساعدتك؟',
      ],
      i18n: {
        en: {
          title: 'مدار للإلكترونيات',
          subtitle: 'مساعد تحليل المبيعات — نحن هنا لمساعدتك',
          footer: '',
          getStarted: 'محادثة جديدة',
          inputPlaceholder: 'اكتب سؤالك هنا...',
          closeButtonTooltip: 'إغلاق',
        },
      },
    });
  }, []);

  return <div></div>;
}
