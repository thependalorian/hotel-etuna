/**
 * Buffr App - Main Entry Screen
 * 
 * Location: app/index.tsx
 * Purpose: Main entry point for the Buffr application
 * 
 * This is the first screen users see when they open the app.
 */

import { View, Text, Image, TouchableOpacity } from 'react-native';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';

export default function IndexScreen() {
  const router = useRouter();

  return (
    <View style={defaultStyles.containerCentered}>
      {/* Buffr Logo */}
      <Image
        source={require('@/assets/images/buffr_logo.png')}
        style={{
          width: 200,
          height: 200,
          marginBottom: 40,
        }}
        resizeMode="contain"
      />

      {/* Welcome Text */}
      <Text style={defaultStyles.header}>Welcome to Buffr</Text>
      <Text style={[defaultStyles.descriptionText, { textAlign: 'center', marginTop: 16 }]}>
        Your financial companion for seamless payments and money management
      </Text>

      {/* Action Buttons */}
      <View style={{ width: '100%', paddingHorizontal: 20, marginTop: 40, gap: 16 }}>
        <TouchableOpacity
          style={defaultStyles.pillButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={defaultStyles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={defaultStyles.buttonOutline}
          onPress={() => {
            // Handle login navigation
            console.log('Login pressed');
          }}
        >
          <Text style={defaultStyles.buttonOutlineText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
