const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

// Supported platforms
config.resolver.platforms = ['ios', 'android', 'native', 'web']

// Disable package.json "exports" resolution to avoid noisy warnings from
// third-party packages that don't yet expose proper React Native conditions.
// Metro will fall back to file-based resolution as before.
config.resolver.unstable_enablePackageExports = false

module.exports = withNativeWind(config, { input: './app/global.css' })
