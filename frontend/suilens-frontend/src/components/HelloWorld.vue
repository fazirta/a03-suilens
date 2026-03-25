<template>
  <v-container class="py-8" max-width="800">
    <v-card>
      <v-card-title>Live Order Notifications</v-card-title>
      <v-divider></v-divider>

      <v-card-text class="py-6" style="min-height: 500px">
        <div v-if="notifications.length === 0" class="text-center text-grey py-8">
          <v-icon size="48" class="mb-2" color="grey-lighten-1">mdi-bell-outline</v-icon>
          <p class="text-sm">No notifications yet</p>
          <p class="text-caption text-grey-darken-1">
            Notifications will appear here in real-time when orders are placed.
          </p>
        </div>

        <div v-else>
          <div v-for="(notification, index) in notifications" :key="index" class="mb-4 pb-4" :style="index < notifications.length - 1
              ? 'border-bottom: 1px solid #eee;'
              : ''
            ">
            <p class="text-sm ma-0">
              Order placed for {{ notification.data.lensName }} by
              {{ notification.data.customerName }}
            </p>
            <p class="text-xs text-grey-darken-1 mt-1">
              {{ formatTime(notification.timestamp) }}
            </p>
          </div>
        </div>
      </v-card-text>

      <v-divider v-if="notifications.length > 0"></v-divider>
      <v-card-actions v-if="notifications.length > 0">
        <v-spacer></v-spacer>
        <v-btn size="small" variant="text" @click="clearNotifications">
          Clear
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- WebSocket connection status -->
    <v-chip class="mt-4" :color="wsConnected ? 'success' : 'error'" size="small" variant="flat">
      <v-icon start size="small">{{ wsConnected ? 'mdi-check-circle' : 'mdi-close-circle' }}</v-icon>
      {{ wsConnected ? 'WebSocket Connected' : 'WebSocket Disconnected' }}
    </v-chip>

    <!-- Snackbar notification toast -->
    <v-snackbar v-model="showSnackbar" :timeout="4000" color="success" location="top right">
      <v-icon start>mdi-bell-ring</v-icon>
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";

const notifications = ref([]);
const wsConnected = ref(false);
const showSnackbar = ref(false);
const snackbarText = ref("");

let ws = null;
let reconnectTimer = null;

const WS_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_NOTIFICATION_WS
    ? import.meta.env.VITE_NOTIFICATION_WS
    : "ws://localhost:3003") + "/ws";

function connectWebSocket() {
  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      wsConnected.value = true;
      console.log("WebSocket connected to", WS_URL);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        notifications.value.unshift(data);

        // Show snackbar toast
        if (data.data) {
          snackbarText.value = `New order: ${data.data.lensName} by ${data.data.customerName}`;
        } else {
          snackbarText.value = "New order notification received!";
        }
        showSnackbar.value = true;
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      wsConnected.value = false;
      console.log("WebSocket disconnected, reconnecting in 3s...");
      scheduleReconnect();
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      ws?.close();
    };
  } catch (err) {
    console.error("WebSocket connection failed:", err);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    connectWebSocket();
  }, 3000);
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function clearNotifications() {
  notifications.value = [];
}

onMounted(() => {
  connectWebSocket();
});

onUnmounted(() => {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (ws) {
    ws.onclose = null; // Prevent reconnect on intentional close
    ws.close();
  }
});
</script>
