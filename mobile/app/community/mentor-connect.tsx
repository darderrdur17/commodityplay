import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Switch,
} from "react-native";
import { mentorApi } from "../../lib/api";

const PRIMARY = "#3280ff";
const NAVY = "#0830a0";

export default function MentorConnectScreen() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState("Energy");
  const [question, setQuestion] = useState("");
  const [memberShareOptIn, setMemberShareOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const segments = ["Energy", "Metals", "Agriculture", "Freight", "General"];

  async function load() {
    try {
      const data = await mentorApi.getQuestions();
      setQuestions(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit() {
    if (!question.trim()) {
      Alert.alert("Required", "Please enter your question.");
      return;
    }
    setSubmitting(true);
    try {
      await mentorApi.submitQuestion(segment, question.trim(), memberShareOptIn);
      setQuestion("");
      Alert.alert("Submitted", "Your question has been sent to a mentor.");
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={PRIMARY} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Ask a Mentor</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          {segments.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.segmentPill, segment === s && styles.segmentPillActive]}
              onPress={() => setSegment(s)}
            >
              <Text style={[styles.segmentText, segment === s && styles.segmentTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TextInput
          style={styles.textarea}
          multiline
          numberOfLines={4}
          placeholder="Your question (anonymous to other members)..."
          value={question}
          onChangeText={setQuestion}
          placeholderTextColor="#9ca3af"
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>
            Consent to anonymous Desk Channel sharing (mentor must also agree; admin review before publication)
          </Text>
          <Switch value={memberShareOptIn} onValueChange={setMemberShareOptIn} trackColor={{ true: PRIMARY }} />
        </View>
        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={submitting}>
          <Text style={styles.submitText}>{submitting ? "Sending..." : "Submit Question"}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Your Questions</Text>
      {questions.length === 0 ? (
        <Text style={styles.empty}>No questions yet. Ask your first one above.</Text>
      ) : (
        questions.map((q) => (
          <View key={q.id} style={styles.qCard}>
            <Text style={styles.qSegment}>{q.segment}</Text>
            <Text style={styles.qText}>{q.question}</Text>
            {q.answer ? (
              <View style={styles.aBlock}>
                <Text style={styles.aLabel}>Mentor Answer</Text>
                <Text style={styles.aText}>{q.answer}</Text>
              </View>
            ) : (
              <Text style={styles.pending}>Awaiting mentor response</Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  formCard: { backgroundColor: NAVY, borderRadius: 14, padding: 16 },
  formTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 12 },
  segmentPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    marginRight: 8,
  },
  segmentPillActive: { backgroundColor: "#fff", borderColor: "#fff" },
  segmentText: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" },
  segmentTextActive: { color: NAVY },
  textarea: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 12,
    color: "#fff",
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  switchLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, flex: 1, marginRight: 8 },
  submitBtn: { marginTop: 14, backgroundColor: "#fff", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  submitText: { color: NAVY, fontWeight: "700", fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  empty: { color: "#677184", fontSize: 13 },
  qCard: { backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e4e7ec" },
  qSegment: { fontSize: 10, fontWeight: "700", color: PRIMARY, textTransform: "uppercase", marginBottom: 6 },
  qText: { fontSize: 14, fontWeight: "600", color: "#1a1a1a", marginBottom: 8 },
  aBlock: { backgroundColor: "#f0f7ff", borderRadius: 8, padding: 10 },
  aLabel: { fontSize: 10, fontWeight: "700", color: PRIMARY, marginBottom: 4 },
  aText: { fontSize: 13, color: "#374151", lineHeight: 19 },
  pending: { fontSize: 12, color: "#677184", fontStyle: "italic" },
});
