import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

type LogoVariant = "horizontal" | "mark" | "white" | "wordmark-tagline";

const SOURCES: Record<LogoVariant, number> = {
  horizontal: require("../assets/brand/logo-horizontal.png"),
  mark: require("../assets/brand/logo-mark.png"),
  white: require("../assets/brand/logo-white.png"),
  "wordmark-tagline": require("../assets/brand/logo-wordmark-tagline.png"),
};

const HEIGHTS: Record<LogoVariant, number> = {
  horizontal: 44,
  mark: 36,
  white: 44,
  "wordmark-tagline": 48,
};

export function Logo({
  variant = "horizontal",
  onPress,
}: {
  variant?: LogoVariant;
  onPress?: () => void;
}) {
  const content = (
    <Image
      source={SOURCES[variant]}
      style={[styles.image, { height: HEIGHTS[variant] }]}
      resizeMode="contain"
      accessibilityLabel="CommodityPlay."
    />
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

export function BrandSearchPrefix() {
  return (
    <View style={styles.searchPrefix}>
      <Image source={SOURCES.mark} style={styles.searchMark} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: 280, maxWidth: "100%" },
  searchPrefix: {
    paddingLeft: 12,
    paddingRight: 8,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#e4e7ec",
  },
  searchMark: { width: 22, height: 22 },
});

export function LogoHomeButton({ variant = "horizontal" as LogoVariant }) {
  return <Logo variant={variant} onPress={() => router.push("/")} />;
}
