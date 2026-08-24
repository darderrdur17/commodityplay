import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Dimensions, Alert
} from "react-native";
import { router } from "expo-router";
import { authApi, contentApi } from "../../lib/api";
import { hasTierAccess, tierAccessLabel } from "../../lib/tiers";

const { width } = Dimensions.get("window");
const NAVY = "#0830a0";
const PRIMARY = "#3280ff";

interface UserData {
  name: string;
  email: string;
  tier: string;
  track: string;
  persona: string | null;
  mentorCredits: number;
}

const CONTENT_TILES = [
  { slug: "glossary", title: "Desk Glossary", desc: "Essential desk terms", route: "/(tabs)/glossary", defaultTier: "STARTER", color: "#16a34a" },
  { slug: "playbook", title: "Full Playbook", desc: "5 ch · 40 sections", route: "/(tabs)/playbook", defaultTier: "PRO", color: PRIMARY },
  { slug: "resume-templates", title: "Resume Templates", desc: "5 persona templates", route: "/pro/resume-templates", defaultTier: "PRO", color: PRIMARY },
  { slug: "career-roadmap", title: "Career Roadmap", desc: "10 role blueprints", route: "/pro/career-roadmap", defaultTier: "PRO", color: PRIMARY },
  { slug: "interview-questions", title: "Interview Qs", desc: "50 desk Q&As", route: "/pro/interview-questions", defaultTier: "PRO", color: PRIMARY },
  { slug: "knowledge-test", title: "Knowledge Test", desc: "20-question gap test", route: "/pro/knowledge-test", defaultTier: "PRO", color: PRIMARY },
  { slug: "case-studies", title: "Case Studies", desc: "10 P&L studies", route: "/community/case-studies", defaultTier: "ELITE", color: "#B45309" },
  { slug: "desk-channel", title: "Desk Channel", desc: "40 practitioner Q&As", route: "/community/desk-channel", defaultTier: "ELITE", color: "#B45309" },
  { slug: "mentor-connect", title: "Mentor Connect", desc: "Ask practitioners", route: "/community/mentor-connect", defaultTier: "ELITE", color: "#B45309" },
  { slug: "job-openings", title: "Job Openings", desc: "Curated roles", route: "/community/job-openings", defaultTier: "ELITE", color: "#B45309" },
];

export default function DashboardTab() {
  const [user, setUser] = useState<UserData | null>(null);
  const [contentTiers, setContentTiers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [me, tiers] = await Promise.all([
        authApi.me(),
        contentApi.getTiers().catch(() => ({ tiers: {} })),
      ]);
      setUser(me.user);
      setContentTiers(tiers.tiers);
    } catch {
      router.replace("/(auth)/login");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading || !user) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const tierColor = user.tier === "ELITE" ? "#B45309" : user.tier === "PRO" ? PRIMARY : "#16a34a";

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} />}
    >
      <View style={styles.headerCard}>
        <View style={styles.headerInner}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{user.name?.[0]?.toUpperCase() || "U"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user.name?.split(" ")[0] || "Trader"}</Text>
          </View>
          <View style={[styles.tierBadge, { borderColor: tierColor }]}>
            <Text style={[styles.tierText, { color: tierColor }]}>{user.tier}</Text>
          </View>
        </View>
        <Text style={styles.syncNote}>Pull down to refresh — content syncs with web admin edits.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Content</Text>
        <View style={styles.tilesGrid}>
          {CONTENT_TILES.map((tile) => {
            const requiredTier = contentTiers[tile.slug] || tile.defaultTier;
            const isLocked = !hasTierAccess(user.tier, requiredTier);

            return (
              <TouchableOpacity
                key={tile.slug}
                style={[styles.tile, isLocked && styles.tileLocked]}
                onPress={() => {
                  if (isLocked) {
                    Alert.alert(tierAccessLabel(requiredTier), "Upgrade your membership to access this feature.");
                    return;
                  }
                  router.push(tile.route as any);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.tileDot, { backgroundColor: tile.color }]} />
                <Text style={styles.tileTitle}>{tile.title}</Text>
                <Text style={styles.tileDesc}>{tile.desc}</Text>
                {requiredTier === "STARTER" ? (
                  <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>Free</Text></View>
                ) : isLocked ? (
                  <View style={[styles.tierBadgeSmall, { borderColor: tile.color }]}>
                    <Text style={[styles.tierBadgeSmallText, { color: tile.color }]}>{requiredTier}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#677184", fontSize: 14 },
  headerCard: { backgroundColor: NAVY, padding: 24, paddingTop: 20 },
  headerInner: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  avatarContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  greeting: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  userName: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  tierBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1.5, backgroundColor: "rgba(255,255,255,0.08)" },
  tierText: { fontSize: 11, fontWeight: "700" },
  syncNote: { color: "rgba(255,255,255,0.5)", fontSize: 11 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a1a", marginBottom: 14 },
  tilesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: { width: (width - 50) / 2, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#e4e7ec" },
  tileLocked: { opacity: 0.7 },
  tileDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 8 },
  tileTitle: { fontSize: 13, fontWeight: "700", color: "#1a1a1a", marginBottom: 3 },
  tileDesc: { fontSize: 11, color: "#677184" },
  freeBadge: { marginTop: 8, alignSelf: "flex-start", backgroundColor: "#f0fdf4", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, borderWidth: 1, borderColor: "#bbf7d0" },
  freeBadgeText: { fontSize: 10, fontWeight: "700", color: "#16a34a" },
  tierBadgeSmall: { marginTop: 8, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, borderWidth: 1 },
  tierBadgeSmallText: { fontSize: 10, fontWeight: "700" },
});
