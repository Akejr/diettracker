module.exports = {
  manifest: {
    name: 'Diet & Workout Tracker',
    short_name: 'Diet Tracker',
    description: 'Acompanhe sua dieta e treinos de forma simples e eficiente',
    theme_color: '#343030',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    icons: true
  },
  images: {
    source: './src/assets/logo.png',
    sizes: [72, 96, 128, 144, 152, 167, 180, 192, 384, 512],
    destination: './public/icons'
  },
  splash: {
    source: './src/assets/splash.png',
    sizes: [
      { width: 2048, height: 2732 },
      { width: 1668, height: 2224 },
      { width: 1536, height: 2048 },
      { width: 1125, height: 2436 },
      { width: 1242, height: 2208 },
      { width: 750, height: 1334 },
      { width: 640, height: 1136 }
    ],
    destination: './public/splash'
  }
}; 