import { useEffect, useState } from 'react';

import type { ServiceItem } from '@/app/(tabs)/study';

export function useServiceList(reloadKey: number): ServiceItem[] {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('http://192.168.50.221:8080/api/services')
      .then(res => res.json())
      .then(data => setServices(data))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  return loading ? [] : services;
}
