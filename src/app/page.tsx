import React from 'react';
import ClientOnlyApp from '@/src/components/ClientOnlyApp';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <ClientOnlyApp />;
}
