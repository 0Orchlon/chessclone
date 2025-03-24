import { StyleSheet, View, useWindowDimensions, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Chessboard, { ChessboardRef } from "react-native-chessboard";
import { useRef } from "react";

export default function TabTwoScreen() {
  const { width, height } = useWindowDimensions();
  const chessboardRef = useRef<ChessboardRef>(null);

  // ✅ STRICT SIZE LIMIT for Web (Fixed issue)
  const chessboardSize =
  Platform.OS === "web"
    ? Math.min(width * 0.2, height * 0.2, 180) // Web: 20% of screen, max 180px
    : Math.min(width * 0.8, height * 0.8, 500); // Mobile: 80% of screen, max 500px

  console.log("Chessboard Size:", chessboardSize); // ✅ Debugging Output

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={[styles.chessboardContainer, { width: chessboardSize, height: chessboardSize }]}>
        <Chessboard ref={chessboardRef} durations={{ move: 1 }} />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chessboardContainer: {
    aspectRatio: 1, // ✅ Ensures a square
    justifyContent: "center",
    alignItems: "center",
  },
});
