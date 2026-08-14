import { Tabs } from "expo-router";
import { BookOpen, LayoutDashboard, User, BookMarked, Users } from "lucide-react-native";
import { Platform } from "react-native";

const NAVY = "#0830a0";
const PRIMARY = "#3280ff";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: "#677184",
        headerStyle: { backgroundColor: NAVY },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        tabBarStyle: {
          borderTopColor: "#e4e7ec",
          backgroundColor: "#ffffff",
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          height: Platform.OS === "ios" ? 80 : 60,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
          headerTitle: "CommodityPlay.",
        }}
      />
      <Tabs.Screen
        name="playbook"
        options={{
          title: "Playbook",
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="glossary"
        options={{
          title: "Glossary",
          tabBarIcon: ({ color, size }) => (
            <BookMarked size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
