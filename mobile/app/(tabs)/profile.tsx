import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert
} from "react-native";
import { router } from "expo-router";
import { removeToken } from "../../lib/api";

const NAVY = "#0830a0";
const PRIMARY = "#3280ff";

const PERSONA_INFO: Record<string, { label: string; color: string; emoji: string }> = {
  FRESH_GRAD: { label: "Fresh Graduate", color: "#0F766E", emoji: "🎓" },
  CAREER_SWITCHER: { label: "Career Switcher", color: "#B45309", emoji: "🔄" },
  INSIDER: { label: "Industry Insider", color: "#5B21B6", emoji: "⚡" },
  ANALYST_TRADER: { label: "Analyst / Trader", color: "#1E3A5F", emoji: "📊" },
  VENDOR: { label: "Vendor / Supplier", color: "#9A3412", emoji: "🤝" },
};

const MENU_ITEMS = [
  { label: "Pricing & Plans", icon: "💳", href: "/?track=career#pricing" },
  { label: "Desk Glossary", icon: "📖", href: "/glossary" },
  { label: "Full Playbook", icon: "📚", href: "/playbook" },
  { label: "Career Roadmap", icon: "🗺️", href: "/career-roadmap" },
  { label: "Mentor Connect", icon: "🤝", href: "/mentor-connect" },
];

export default function ProfileTab() {
  // In a real app, get from auth context
  const [user] = useState({
    name: "Alex Chen",
    email: "alex@example.com",
    tier: "STARTER",
    track: "CAREER",
    persona: "FRESH_GRAD" as keyof typeof PERSONA_INFO,
    mentorCredits: 0,
  });

  const persona = user.persona ? PERSONA_INFO[user.persona] : null;
  const tierColor = user.tier === "ELITE" ? "#B45309" : user.tier === "PRO" ? PRIMARY : "#16a34a";

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await removeToken();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name[0]}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={[styles.tierBadge, { borderColor: tierColor }]}>
          <Text style={[styles.tierText, { color: tierColor }]}>{user.tier} Member</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{user.track}</Text>
            <Text style={styles.statLbl}>Track</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{user.mentorCredits}</Text>
            <Text style={styles.statLbl}>Mentor Credits</Text>
          </View>
          {persona && (
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{persona.emoji}</Text>
              <Text style={styles.statLbl}>{persona.label}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Persona card */}
      {persona && (
        <View style={[styles.personaCard, { borderLeftColor: persona.color }]}>
          <Text style={styles.personaEmoji}>{persona.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.personaLabel}>Your Persona</Text>
            <Text style={[styles.personaName, { color: persona.color }]}>{persona.label}</Text>
          </View>
        </View>
      )}

      {/* Menu */}
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Quick Access</Text>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuItem} activeOpacity={0.7}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign out */}
      <View style={styles.menuSection}>
        <TouchableOpacity
          style={[styles.menuItem, styles.signOutItem]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    backgroundColor: NAVY,
    alignItems: "center",
    padding: 28,
    paddingTop: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  name: { color: "#fff", fontSize: 20, fontWeight: "700", fontFamily: "serif", marginBottom: 2 },
  email: { color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 10 },
  tierBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  tierText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  statsRow: { flexDirection: "row", gap: 12 },
  statItem: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 12,
    minWidth: 80,
    alignItems: "center",
  },
  statVal: { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 2 },
  statLbl: { color: "rgba(255,255,255,0.45)", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 },
  personaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "#e4e7ec",
  },
  personaEmoji: { fontSize: 24 },
  personaLabel: { fontSize: 10, color: "#677184", textTransform: "uppercase", letterSpacing: 0.5 },
  personaName: { fontSize: 15, fontWeight: "700" },
  menuSection: { paddingHorizontal: 16, marginBottom: 8 },
  menuSectionTitle: { fontSize: 11, fontWeight: "700", color: "#677184", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: 8 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#e4e7ec",
  },
  menuIcon: { fontSize: 18 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  menuArrow: { fontSize: 18, color: "#9ca3af" },
  signOutItem: { borderColor: "#fca5a5", backgroundColor: "#fff7f7" },
  signOutText: { color: "#ef4444", fontWeight: "700", fontSize: 14, flex: 1 },
});
