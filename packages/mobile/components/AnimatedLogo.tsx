import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, View, StyleSheet } from "react-native";

interface Props {
  size?: number;
}

const DOT_COUNT = 10;

export function AnimatedLogo({ size = 200 }: Props) {
  // Entrance: fade + scale in
  const entranceFade = useRef(new Animated.Value(0)).current;
  const entranceScale = useRef(new Animated.Value(0.6)).current;

  // Breathing pulse on logo
  const breathScale = useRef(new Animated.Value(1)).current;

  // Ring rotation
  const ringRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(entranceFade, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(entranceScale, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After entrance, start breathing + ring spin
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathScale, {
            toValue: 1.06,
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(breathScale, {
            toValue: 1,
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(ringRotation, {
          toValue: 1,
          duration: 6000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    });
  }, []);

  const rotate = ringRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const radius = size / 2 + 18;
  const dotSize = Math.max(5, size * 0.035);

  // Pre-compute dot positions around the ring
  const dots = Array.from({ length: DOT_COUNT }, (_, i) => {
    const angle = (i / DOT_COUNT) * 2 * Math.PI;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    const opacity = 0.3 + (i / DOT_COUNT) * 0.7;
    return { x, y, opacity };
  });

  const containerSize = size + (radius + dotSize) * 2;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          width: containerSize,
          height: containerSize,
          opacity: entranceFade,
          transform: [{ scale: entranceScale }],
        },
      ]}
    >
      {/* Rotating dot ring */}
      <Animated.View
        style={[
          styles.ringContainer,
          {
            width: containerSize,
            height: containerSize,
            transform: [{ rotate }],
          },
        ]}
      >
        {dots.map((dot, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                opacity: dot.opacity,
                position: "absolute",
                left: containerSize / 2 + dot.x - dotSize / 2,
                top: containerSize / 2 + dot.y - dotSize / 2,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Breathing logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            width: size,
            height: size,
            transform: [{ scale: breathScale }],
          },
        ]}
      >
        <Image
          source={require("../assets/logo.png")}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringContainer: {
    position: "absolute",
  },
  dot: {
    backgroundColor: "#e02020",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
