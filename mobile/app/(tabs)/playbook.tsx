import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { playbookMetaApi, getToken } from "../../lib/api";
import { tierAccessLabel } from "../../lib/tiers";

const NAVY = "#0830a0";
const PRIMARY = "#3280ff";

type Chapter = {
  id: string;
  letter: string;
  title: string;
  subtitle: string;
  color: string;
  sectionCount: number;
  preview: boolean;
  unlocked: boolean;
};

export default function PlaybookTab() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        router.replace("/(auth)/login");
        return;
      }
      const data = await playbookMetaApi.getChapters();
      setChapters(data.chapters);
    } catch {
      router.replace("/(auth)/login");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={PRIMARY} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>The Full Playbook</Text>
        <Text style={styles.headerSub}>5 chapters · 40 sections</Text>
      </View>

      <FlatList
        data={chapters}
        keyExtractor={(c) => c.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
        renderItem={({ item: chapter }) => (
          <TouchableOpacity
            style={[styles.chapterCard, !chapter.unlocked && styles.chapterLocked]}
            onPress={() => {
              if (!chapter.unlocked) {
                Alert.alert(tierAccessLabel("PRO"), "Upgrade your membership to access this feature.");
                return;
              }
              router.push(`/playbook/${chapter.id}` as any);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.chapterLetter, { backgroundColor: chapter.color }]}>
              <Text style={styles.chapterLetterText}>{chapter.letter}</Text>
            </View>
            <View style={styles.chapterInfo}>
              <View style={styles.chapterTitleRow}>
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                {chapter.preview && (
                  <View style={styles.previewBadge}>
                    <Text style={styles.previewBadgeText}>Preview</Text>
                  </View>
                )}
                {!chapter.unlocked && (
                  <View style={styles.lockBadge}>
                    <Text style={styles.lockBadgeText}>Pro</Text>
                  </View>
                )}
              </View>
              <Text style={styles.chapterSub} numberOfLines={2}>{chapter.subtitle}</Text>
              <Text style={styles.chapterMeta}>{chapter.sectionCount} sections</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    backgroundColor: NAVY,
    padding: 20,
    paddingTop: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSub: { color: "rgba(255,255,255,0.55)", fontSize: 13 },
  chapterCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e4e7ec",
  },
  chapterLocked: { opacity: 0.65 },
  chapterLetter: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chapterLetterText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  chapterInfo: { flex: 1, minWidth: 0 },
  chapterTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  chapterTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a1a", flexShrink: 1 },
  chapterSub: { fontSize: 12, color: "#677184", marginTop: 2 },
  chapterMeta: { fontSize: 11, color: "#9ca3af", marginTop: 3 },
  previewBadge: {
    backgroundColor: "#f0fdf4",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  previewBadgeText: { fontSize: 9, fontWeight: "700", color: "#16a34a" },
  lockBadge: {
    backgroundColor: "#eff6ff",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  lockBadgeText: { fontSize: 9, fontWeight: "700", color: PRIMARY },
});
