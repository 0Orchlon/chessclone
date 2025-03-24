import React, { useState } from "react";
import { View, Text } from "react-native";
import { Chess } from "chess.js";
import { Chessboard } from "react-native-chessboard";
import { useWebSocket } from "@/constants/useWebSocket";

export default function ChessGame() {
  const [chess, setChess] = useState(new Chess());
  const { sendMove } = useWebSocket(setChess);

  const handleMove = (from: string, to: string) => {
    const gameCopy = new Chess(chess.fen());
    if (gameCopy.move({ from, to })) {
      setChess(gameCopy);
      sendMove(gameCopy); // Send move to other players
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Multiplayer Chess</Text>
      <Chessboard position={chess.fen()} onMove={handleMove} />
    </View>
  );
}
