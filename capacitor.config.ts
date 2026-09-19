import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'sv.facturasv.app',
  appName: 'FacturaSV',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
