import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from "react-native";
import { contentApi } from "../../lib/api";

const PRIMARY = "#3280ff";

type TestSet = { id: string; label: string; questions: any[] };

export default function KnowledgeTestScreen() {
  const [sets, setSets] = useState<TestSet[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [answersBySet, setAnswersBySet] = useState<Record<string, Record<string, number>>>({});
  const [submittedBySet, setSubmittedBySet] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await contentApi.get<{
        questions: any[];
        testSets?: TestSet[];
      }>("knowledge-test");
      const nextSets =
        data.testSets?.length
          ? data.testSets
          : [{ id: "default", label: "Default bank", questions: data.questions ?? [] }];
      setSets(nextSets);
      setSelectedId((prev) => (nextSets.some((s) => s.id === prev) ? prev : nextSets[0]?.id ?? ""));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const selected = sets.find((s) => s.id === selectedId) ?? sets[0];
  const questions = selected?.questions ?? [];
  const answers = answersBySet[selected?.id ?? ""] ?? {};
  const submitted = Boolean(submittedBySet[selected?.id ?? ""]);
  const score = submitted
    ? questions.filter((q) => answers[q.id] === q.correctIndex).length
    : 0;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={PRIMARY} size="large" /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
    >
      {sets.length > 1 && (
        <View style={styles.pickerRow}>
          {sets.map((set) => (
            <TouchableOpacity
              key={set.id}
              onPress={() => setSelectedId(set.id)}
              style={[styles.pickerChip, set.id === selected?.id && styles.pickerChipActive]}
            >
              <Text style={[styles.pickerText, set.id === selected?.id && styles.pickerTextActive]}>
                {set.label}
                {submittedBySet[set.id] ? " · done" : ""}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {submitted && (
        <View style={styles.scoreCard}>
          <Text style={styles.scoreText}>Score: {score} / {questions.length}</Text>
        </View>
      )}
      {questions.map((q, qi) => (
        <View key={q.id} style={styles.card}>
          <Text style={styles.qLabel}>Q{qi + 1} · {q.topic}</Text>
          <Text style={styles.q}>{q.question}</Text>
          {q.options.map((opt: string, i: number) => {
            const isSelected = answers[q.id] === i;
            const showCorrect = submitted && i === q.correctIndex;
            return (
              <TouchableOpacity
                key={i}
                disabled={submitted}
                onPress={() => {
                  if (!selected) return;
                  setAnswersBySet((prev) => ({
                    ...prev,
                    [selected.id]: { ...(prev[selected.id] ?? {}), [q.id]: i },
                  }));
                }}
                style={[styles.opt, isSelected && styles.optSelected, showCorrect && styles.optCorrect]}
              >
                <Text style={styles.optText}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
      {!submitted && (
        <TouchableOpacity
          style={styles.submit}
          onPress={() => selected && setSubmittedBySet((prev) => ({ ...prev, [selected.id]: true }))}
          disabled={questions.some((q) => answers[q.id] === undefined)}
        >
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      )}
      {submitted && sets.filter((s) => s.id !== selected?.id && !submittedBySet[s.id]).length > 0 && (
        <TouchableOpacity
          style={styles.submit}
          onPress={() => {
            const next = sets.find((s) => s.id !== selected?.id && !submittedBySet[s.id]);
            if (next) setSelectedId(next.id);
          }}
        >
          <Text style={styles.submitText}>Continue with another set</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  pickerRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pickerChip: { borderWidth: 1, borderColor: "#e4e7ec", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#fff" },
  pickerChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  pickerText: { fontSize: 12, fontWeight: "600", color: "#1a1a1a" },
  pickerTextActive: { color: "#fff" },
  scoreCard: { backgroundColor: "#eff6ff", borderRadius: 12, padding: 14 },
  scoreText: { fontSize: 16, fontWeight: "700", color: PRIMARY },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e4e7ec" },
  qLabel: { fontSize: 11, color: "#677184", marginBottom: 4 },
  q: { fontSize: 14, fontWeight: "600", color: "#1a1a1a", marginBottom: 10 },
  opt: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "#e4e7ec", marginBottom: 6 },
  optSelected: { borderColor: PRIMARY, backgroundColor: "#eff6ff" },
  optCorrect: { borderColor: "#16a34a", backgroundColor: "#f0fdf4" },
  optText: { fontSize: 13, color: "#374151" },
  submit: { backgroundColor: PRIMARY, borderRadius: 10, padding: 14, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "700" },
});
