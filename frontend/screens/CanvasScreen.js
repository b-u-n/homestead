import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import { observer } from 'mobx-react-lite';
import AuthStore from '../stores/AuthStore';
import domain from '../utils/domain';

const CanvasScreen = observer(({ navigation }) => {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 800, 
    height: typeof window !== 'undefined' ? window.innerHeight : 600 
  });
  const [avatarPosition, setAvatarPosition] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 400, 
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300 
  });
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [avatarImage, setAvatarImage] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Background image from imgur
  const BACKGROUND_URL = 'https://i.imgur.com/ueUozbi.png';

  // Load user profile with full avatar data
  const loadUserProfile = async () => {
    if (!AuthStore.user?.id || !AuthStore.token) return;

    try {
      const response = await fetch(`${domain()}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${AuthStore.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
        console.log('User profile loaded:', data.user);
        
        // Load avatar image if available
        if (data.user.avatar) {
          const avatarImg = new Image();
          avatarImg.onload = () => {
            console.log('Avatar loaded successfully from backend');
            setAvatarImage(avatarImg);
          };
          avatarImg.onerror = (error) => {
            console.error('Failed to load avatar from backend:', error);
          };
          const avatarUrl = data.user.avatar.startsWith('/') 
            ? `${domain()}${data.user.avatar}`
            : data.user.avatar;
          avatarImg.src = avatarUrl;
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  useEffect(() => {
    // Update canvas size on window resize
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setCanvasSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Load background image
    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    bgImg.onload = () => {
      setBackgroundImage(bgImg);
    };
    bgImg.src = BACKGROUND_URL;

    // Load user profile and avatar
    loadUserProfile();

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  useEffect(() => {
    drawCanvas();
  }, [backgroundImage, avatarImage, avatarPosition]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Fill entire screen with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw background image centered
    if (backgroundImage) {
      const bgAspectRatio = backgroundImage.width / backgroundImage.height;
      const screenAspectRatio = canvasSize.width / canvasSize.height;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      // Center the background image while maintaining aspect ratio
      if (bgAspectRatio > screenAspectRatio) {
        // Background is wider - fit to height
        drawHeight = canvasSize.height;
        drawWidth = drawHeight * bgAspectRatio;
        drawX = (canvasSize.width - drawWidth) / 2;
        drawY = 0;
      } else {
        // Background is taller - fit to width
        drawWidth = canvasSize.width;
        drawHeight = drawWidth / bgAspectRatio;
        drawX = 0;
        drawY = (canvasSize.height - drawHeight) / 2;
      }
      
      ctx.drawImage(backgroundImage, drawX, drawY, drawWidth, drawHeight);
    } else {
      // Fallback background centered
      const fallbackWidth = 800;
      const fallbackHeight = 600;
      const fallbackX = (canvasSize.width - fallbackWidth) / 2;
      const fallbackY = (canvasSize.height - fallbackHeight) / 2;
      
      ctx.fillStyle = '#2a2a4e';
      ctx.fillRect(fallbackX, fallbackY, fallbackWidth, fallbackHeight);
      
      // Draw some simple ground/grass
      ctx.fillStyle = '#4a5f4a';
      ctx.fillRect(fallbackX, fallbackY + fallbackHeight - 100, fallbackWidth, 100);
    }

    // Draw avatar
    if (avatarImage) {
      const avatarSize = 64;
      ctx.drawImage(
        avatarImage, 
        avatarPosition.x - avatarSize/2, 
        avatarPosition.y - avatarSize/2, 
        avatarSize, 
        avatarSize
      );
    } else {
      // Fallback avatar (simple circle)
      ctx.fillStyle = '#ff006e';
      ctx.beginPath();
      ctx.arc(avatarPosition.x, avatarPosition.y, 20, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Move avatar to clicked position
    setAvatarPosition({ x, y });
  };

  if (typeof document !== 'undefined') {
    // Web version with HTML canvas
    return (
      <View style={styles.container}>
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={styles.canvas}
          onClick={handleCanvasClick}
        />
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Mobile fallback - simple view for now
  return (
    <View style={styles.container}>
      <View style={styles.mobileCanvas}>
        <Text style={styles.placeholderText}>Canvas Mode</Text>
        <Text style={styles.placeholderText}>Avatar: {AuthStore.user?.avatar ? 'Loaded' : 'None'}</Text>
        <Text style={styles.placeholderText}>Position: ({avatarPosition.x}, {avatarPosition.y})</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    display: 'block',
    width: '100vw',
    height: '100vh',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#ff006e',
    padding: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  mobileCanvas: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: 20,
    borderRadius: 8,
  },
  placeholderText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
});

export default CanvasScreen;