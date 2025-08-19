import { View, Text, TouchableOpacity, Image, Animated, Platform } from 'react-native'
import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'

export default function Component() {
  // System font configuration
  const systemFont = Platform.select({ 
    ios: 'System', 
    android: 'Roboto' 
  })
  
  const handlePassPress = () => {
    router.push('/')
  }
  const [currentTime, setCurrentTime] = useState(new Date())
  const circleScale = useRef(new Animated.Value(1)).current
  const insets = useSafeAreaInsets()

  const animateCircle = () => {
    // Reset to initial scale
    circleScale.setValue(1)

    Animated.sequence([
      // First pulse - small
      Animated.sequence([
        Animated.timing(circleScale, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(circleScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Second pulse - medium
      Animated.sequence([
        Animated.timing(circleScale, {
          toValue: 1.4,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(circleScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Third pulse - large
      Animated.sequence([
        Animated.timing(circleScale, {
          toValue: 1.6,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(circleScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Restart the animation
      animateCircle()
    })
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    animateCircle()

    return () => {
      clearInterval(timer)
    }
  }, [])

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  }

  const getExpirationTime = () => {
    const expirationTime = new Date(currentTime.getTime() + 30 * 60000) // Add 30 minutes
    return expirationTime.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <SafeAreaView 
      className='flex-1 bg-white'
      edges={['top', 'right', 'left']}
      style={{
        paddingBottom: Platform.OS === 'android' ? insets.bottom > 0 ? insets.bottom : 20 : 0
      }}
    >
      <View className='bg-white h-full'>
        {/* Header */}
        <View className='p-4 flex-row justify-between items-start'>
          <View>
            <Text 
              className='text-3xl font-bold text-[#3C4043]'
              style={{ fontFamily: systemFont }}
            >
              Huntsville Transit
            </Text>
            <Text 
              className='text-lg font text-gray-600'
              style={{ fontFamily: systemFont }}
            >
              Show operator your ticket
            </Text>
          </View>
          <TouchableOpacity onPress={handlePassPress} className='p-2'>
            <X color={'black'} size={32} className='text-gray-800' />
          </TouchableOpacity>
        </View>

        {/* Logo with Animated Circle */}
        <View className='items-center justify-center mt-16'>
          <View className='w-36 h-36 items-center justify-center'>
            {/* Animated Circles */}
            <Animated.View
              style={{
                position: 'absolute',
                width: 144,
                height: 144,
                borderRadius: 72,
                backgroundColor: '#2F6599',
                transform: [{ scale: circleScale }],
                opacity: 1,
              }}
            />
            <Animated.View
              style={{
                position: 'absolute',
                width: 144,
                height: 144,
                borderRadius: 72,
                backgroundColor: '#3B80C1',
                transform: [{ scale: circleScale }],
                opacity: 1,
              }}
            />
            {/* Static Logo Circle */}
            <View className='w-36 h-36 rounded-full bg-white border-4 border-[#3B80C1] items-center justify-center'>
              <Image
                source={require('../assets/images/ticket.png')}
                className='w-20 h-10'
                resizeMode='cover'
                style={{ transform: [{ scale: 1.2 }] }}
              />
            </View>
          </View>
        </View>

        {/* Time Display */}
        <View className='items-center mt-32'>
          <Text 
            className='text-7xl font-semibold text-[#3C4043]'
            style={{ fontFamily: systemFont }}
          >
            {formatTime(currentTime)}
          </Text>
        </View>

        {/* Reduced Banner */}
        <View className='bg-[#F00] py-4 m-4 rounded-full'>
          <Text 
            className='text-white text-5xl text-center'
            style={{ fontFamily: systemFont }}
          >
            Reduced
          </Text>
        </View>

        {/* Ticket Details */}
        <View
          className='bg-[#FFF] rounded-lg mx-4 p-6'
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Text 
            className='text-3xl text-[#3C4043]'
            style={{ fontFamily: systemFont }}
          >
            Reduced 1 Ride
          </Text>
          <Text 
            className='text-gray-600 text-lg mb-6'
            style={{ fontFamily: systemFont }}
          >
            Huntsville, AL
          </Text>
          <Text 
            className='text-gray-600 text-xl font-bold'
            style={{ fontFamily: systemFont }}
          >
            Expires {getExpirationTime()}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}
