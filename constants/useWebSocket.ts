import { useEffect, useRef } from "react";
import { Chess } from "chess.js";

const SERVER_IP = "192.168.0.161"; // Replace with your local WiFi IP
const SERVER_PORT = "8081";

export const useWebSocket = (setChess: (game: Chess) => void) => {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(`ws://${SERVER_IP}:${SERVER_PORT}`);

    ws.current.onmessage = (event) => {
      const move = JSON.parse(event.data);
      const gameCopy = new Chess();
      gameCopy.loadPgn(move.pgn);
      setChess(gameCopy);
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const sendMove = (game: Chess) => {
    ws.current?.send(JSON.stringify({ pgn: game.pgn() }));
  };

  return { sendMove };
};
