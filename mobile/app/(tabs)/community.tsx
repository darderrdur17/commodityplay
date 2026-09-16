import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
} from "react-native";
import { router } from "expo-router";
import { MessageSquare, Briefcase, Bell, Users, ChevronRight, Lock, BookOpen } from "lucide-react-native";
import { authApi, getToken } from "../../lib/api";
import { tierAccessLabel } from "../../lib/tiers";

const NAVY = "#0830a0";
const PRIMARY = "#3280ff";
const ELITE = "#B45309";

const COMMUNITY_LINKS = [
  {
    title: "Case Studies",
    desc: "10 real-world scenarios with P&L breakdowns",
    route: "/community/case-studies",
    tier: "ELITE",
    icon: BookOpen,
    color: ELITE,
  },
  {
    title: "Desk Channel",
    desc: "40 practitioner Q&As across 5 segments",
    route: "/community/desk-channel",
    tier: "ELITE",
    icon: MessageSquare,
    color: ELITE,
  },
  {
    title: "Mentor Connect",
    desc: "Ask practitioners anonymously",
    route: "/community/mentor-connect",
    tier: "ELITE",
    icon: Users,
    color: ELITE,
  },
  {
    title: "Job Openings - Live Chat Feature",
    desc: "Curated commodity trading roles",
    route: "/community/job-openings",
    tier: "ELITE",
    icon: Briefcase,
    color: ELITE,
  },
  {
    title: "Job Board Waitlist",
    desc: "Get notified when the board launches",
    route: "/community/waitlist",
    tier: null,
    icon: Bell,
    color: PRIMARY,
  },
];

export default function CommunityTab() {
  const [userTier, setUserTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          router.replace("/(auth)/login");
          return;
        }
        const data = await authApi.me();
        setUserTier(data.user.tier);
      } catch {
        router.replace("/(auth)/login");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={PRIMARY} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Community</Text>
        <Text style={styles.heroDesc}>
          Elite practitioner resources and the job board waitlist.
        </Text>
      </View>

      <View style={styles.list}>
        {COMMUNITY_LINKS.map((item) => {
          const locked = item.tier === "ELITE" && userTier !== "ELITE";
          const Icon = item.icon;

          return (
            <TouchableOpacity
              key={item.title}
              style={[styles.card, locked && styles.cardLocked]}
              activeOpacity={0.7}
              onPress={() => {
                if (locked) {
                  Alert.alert(tierAccessLabel(item.tier), "Upgrade your membership to access this feature.");
                  return;
                }
                router.push(item.route as any);
              }}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${item.color}18` }]}>
                <Icon size={22} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {item.tier && (
                    <View style={[styles.tierPill, { borderColor: item.color }]}>
                      <Text style={[styles.tierPillText, { color: item.color }]}>{item.tier}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>
              {locked ? (
                <Lock size={18} color="#677184" />
              ) : (
                <ChevronRight size={18} color="#677184" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: {
    backgroundColor: NAVY,
    padding: 24,
    paddingTop: 16,
  },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 6 },
  heroDesc: { color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 20 },
  list: { padding: 16, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e4e7ec",
  },
  cardLocked: { opacity: 0.75 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  cardDesc: { fontSize: 12, color: "#677184", lineHeight: 17 },
  tierPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  tierPillText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
});
