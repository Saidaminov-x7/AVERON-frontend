'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export function useSmsVerificationAvailability() {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    api.get<{ smsVerification?: boolean }>('/api/v1/capabilities')
      .then(({ data }) => {
        if (active) setAvailable(data.smsVerification === true);
      })
      .catch(() => {
        if (active) setAvailable(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return available;
}
