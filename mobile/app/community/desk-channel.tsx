import React, { useEffect, useState, useMemo } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from "react-native";
import { communityApi } from "../../lib/api";

const PRIMARY = "#3280ff";

export default function DeskChannelScreen() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [freshness, setFreshness] = useState<{
    lastRefreshedLabel: string | null;
    newThisMonth: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  async function load() {
    try {
      const data = await communityApi.getDeskChannel();
      setQuestions(data.questions);
      setFreshness(data.freshness ?? null);
      setError("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return questions;
    const q = search.toLowerCase();
    return questions.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
    );
  }, [questions, search]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={PRIMARY} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search questions..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9ca3af"
        />
      </View>
      {freshness ? (
        <View style={styles.freshness}>
          <Text style={styles.freshnessPrimary}>
            Bank last refreshed{" "}
            <Text style={styles.freshnessStrong}>{freshness.lastRefreshedLabel ?? "—"}</Text>
          </Text>
          <View style={styles.freshnessRow}>
            <Text style={styles.freshnessMeta}>
              <Text style={styles.freshnessStrong}>{freshness.newThisMonth}</Text> new this month
            </Text>
            <Text style={styles.freshnessMeta}>
              <Text style={styles.freshnessStrong}>{freshness.total}</Text> questions total
            </Text>
          </View>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        {filtered.map((q) => (
          <TouchableOpacity
            key={q.id}
            style={styles.card}
            onPress={() => setOpenId(openId === q.id ? null : q.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.category, { color: q.categoryColor }]}>{q.categoryLabel}</Text>
            <Text style={styles.question}>{q.question}</Text>
            {openId === q.id && (
              <View style={styles.answerBlock}>
                <Text style={styles.answer}>{q.answer}</Text>
                {q.deskSignal && (
                  <View style={styles.signal}>
                    <Text style={styles.signalLabel}>Desk Implication</Text>
                    <Text style={styles.signalText}>{q.deskSignal}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { color: "#dc2626", textAlign: "center" },
  searchWrap: { padding: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e4e7ec" },
  freshness: {
    marginHorizontal: 12,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e7ec",
  },
  freshnessPrimary: { fontSize: 14, color: "#1f2937", marginBottom: 6 },
  freshnessStrong: { fontWeight: "700", color: "#111827" },
  freshnessRow: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  freshnessMeta: { fontSize: 13, color: "#6b7280" },
  search: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  list: { padding: 12, gap: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e4e7ec",
  },
  category: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", marginBottom: 6 },
  question: { fontSize: 14, fontWeight: "600", color: "#1a1a1a", lineHeight: 20 },
  answerBlock: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#e4e7ec" },
  answer: { fontSize: 13, color: "#374151", lineHeight: 20 },
  signal: { marginTop: 10, backgroundColor: "#111827", borderRadius: 8, padding: 12 },
  signalLabel: { fontSize: 10, color: PRIMARY, fontWeight: "700", marginBottom: 4 },
  signalText: { fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 18 },
});
