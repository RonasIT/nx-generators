'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { ReactElement, useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
}

export default function GlobalError({ error }: GlobalErrorProps): ReactElement {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={undefined as any} />
      </body>
    </html>
  );
}
