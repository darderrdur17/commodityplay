import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { playbookMetaApi } from "../../lib/api";

const PRIMARY = "#3280ff";

export default function PlaybookChapterScreen() {
  const { chapter } = useLocalSearchParams<{ chapter: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chapterMeta, setChapterMeta] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    if (!chapter) return;
    playbookMetaApi
      .getChapters()
      .then((data) => {
        const ch = data.chapters.find((c) => c.id === chapter);
        if (!ch) throw new Error("Chapter not found");
        if (ch.releasingSoon && !ch.unlocked) {
          throw new Error("This chapter is releasing soon.");
        }
        setChapterMeta(ch);
        setSections(data.sections[chapter] || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [chapter]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={PRIMARY} size="large" />
      </View>
    );
  }

  if (error || !chapterMeta) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || "Not found"}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: chapterMeta.color || "#0830a0" }]}>
        <Text style={styles.letter}>Chapter {chapterMeta.letter}</Text>
        <Text style={styles.title}>{chapterMeta.title}</Text>
        <Text style={styles.sub}>{chapterMeta.subtitle}</Text>
      </View>

      {sections.length === 0 ? (
        <Text style={styles.empty}>No sections loaded. Pull to refresh on the Playbook tab.</Text>
      ) : (
        sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionNum}>{section.number}</Text>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.desc ? <Text style={styles.sectionDesc}>{section.desc}</Text> : null}
            {(section.paragraphs || []).map((p: string, i: number) => (
              <Text key={i} style={styles.para}>{p}</Text>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { color: "#dc2626", textAlign: "center" },
  content: { paddingBottom: 40 },
  hero: { padding: 20, marginBottom: 12 },
  letter: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "700", marginBottom: 4 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 6 },
  sub: { color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 18 },
  empty: { padding: 20, color: "#677184", textAlign: "center" },
  section: { backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#e4e7ec" },
  sectionNum: { fontSize: 10, fontWeight: "700", color: PRIMARY, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 8 },
  sectionDesc: { fontSize: 13, color: "#677184", marginBottom: 10, fontStyle: "italic" },
  para: { fontSize: 14, color: "#374151", lineHeight: 22, marginBottom: 10 },
});
