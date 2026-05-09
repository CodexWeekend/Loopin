import { getCityDiscoveryView } from '@loopin/shared';

export function createDiscoveryRepository() {
  return {
    getCity(citySlug: string) {
      return getCityDiscoveryView(citySlug);
    },
  };
}
