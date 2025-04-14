import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { Chess } from 'chess.js';

// Type definitions
interface ChessPiece {
  type: string;
  color: 'w' | 'b';
}

interface GameState {
  board: (ChessPiece | null)[][];
  currentPlayer: 'w' | 'b';
  fen: string;
  isGameOver: boolean;
}

// Helper function (make sure this exists in ../../utils/utils.ts)
export const getPieceSymbol = (piece: ChessPiece): string => {
  const whiteSymbols: { [key: string]: string } = {
    'k': '♔', 'q': '♕', 'r': '♖',
    'b': '♗', 'n': '♘', 'p': '♙'
  };

  const blackSymbols: { [key: string]: string } = {
    'k': '♚', 'q': '♛', 'r': '♜',
    'b': '♝', 'n': '♞', 'p': '♟'
  };

  return piece.color === 'w'
    ? whiteSymbols[piece.type]
    : blackSymbols[piece.type];
};


const socket: Socket = io('http://192.168.67.246:3001', {
  transports: ['websocket']
});

const ChessGame = () => {
  const [matchId, setMatchId] = useState<string>('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [playerColor, setPlayerColor] = useState<'w' | 'b' | ''>('');
  const [promotionSquare, setPromotionSquare] = useState<string | null>(null);
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);

  useEffect(() => {  
    socket.on('matchCreated', (createdMatchId: string) => {
      setMatchId(createdMatchId);
      setIsHost(true);
      setPlayerColor('w');
      const chess = new Chess();
  const initialBoard = chess.board().map((row) =>
    row.map((cell) => cell ? { type: cell.type, color: cell.color } : null)
  );

  setGameState({
    board: initialBoard,
    currentPlayer: 'w',
    fen: chess.fen(),
    isGameOver: false
  });
    });
  
    socket.on('matchJoined', (joinedMatchId: string) => {
      setMatchId(joinedMatchId);
      setIsHost(false);
      setPlayerColor('b');
    });
    
    socket.on('gameState', (state: GameState) => {
      setGameState(state);
    });
    
    socket.on('opponentJoined', () => {
      Alert.alert('Opponent Joined', 'The game can begin!');
    });
  
    socket.on('error', (message: string) => {
      Alert.alert('Error', message);
    });
  
    return () => {
      socket.off('gameState');
      socket.off('matchCreated');
      socket.off('matchJoined');
      socket.off('opponentJoined');
      socket.off('error');
    };
  }, []);
  
  const createMatch = () => {
    socket.emit('createMatch');
  };

  const joinMatch = () => {
    if (matchId.length > 0) {
      socket.emit('joinMatch', matchId);
    }
  };
  const adjustSquareForFlippedBoard = (square: string): string => {
    if (playerColor !== 'b') return square; // no change needed for white
  
    const file = square.charCodeAt(0) - 97; // 'a' -> 0
    const rank = parseInt(square[1]);       // '8' -> 8
  
    const flippedFile = 7 - file;
    const flippedRank = 9 - rank;
  
    return `${String.fromCharCode(97 + flippedFile)}${flippedRank}`;
  };
  
  const handleSquarePress = (square: string) => {
    if (!gameState || gameState.isGameOver || !playerColor) return;
  
    const game = new Chess(gameState.fen);
    const piece = game.get(square);
  
    if (!selectedSquare) {
      // First tap: select your own piece
      if (piece && piece.color === playerColor && piece.color === game.turn()) {
        setSelectedSquare(square);
      }
    } else {
      // Check if player tapped the same color piece again — switch selection
      if (piece && piece.color === playerColor && square !== selectedSquare) {
        setSelectedSquare(square);
        return;
      }
  
      // Check if the move is legal before making it
      const legalMoves = game.moves({ square: selectedSquare, verbose: true });
      const isLegalMove = legalMoves.some((m) => m.to === square);
  
      if (!isLegalMove) {
        setSelectedSquare(null); // Clear selection on invalid tap
        return;
      }
  
      const move = game.move({
        from: selectedSquare,
        to: square,
        promotion: 'q'
      });
  
      if (move?.flags.includes('p')) {
        setPendingFrom(selectedSquare);
        setPromotionSquare(square);
      } else if (move) {
        socket.emit('makeMove', {
          matchId,
          from: selectedSquare,
          to: square,
          promotion: move.promotion
        });
      }
  
      setSelectedSquare(null);
    }
  };
  
  const handlePromotion = (promotionType: string) => {
    if (pendingFrom && promotionSquare) {
      socket.emit('makeMove', {
        matchId,
        from: pendingFrom,
        to: promotionSquare,
        promotion: promotionType
      });
      setPromotionSquare(null);
      setPendingFrom(null);
    }
  };

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Chess Multiplayer</Text>
        <TouchableOpacity style={styles.button} onPress={createMatch}>
          <Text>Create Match</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Enter Match ID"
          value={matchId}
          onChangeText={setMatchId}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={joinMatch}>
          <Text>Join Match</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderBoard = (flipped: boolean) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  
    const rows = [];
  
    for (let row = 0; row < 8; row++) {
      const y = flipped ? row : 7 - row;
      const currentRow = [];
  
      for (let col = 0; col < 8; col++) {
        const x = flipped ? 7 - col : col;
        const square = `${files[x]}${y + 1}`;
  
        const piece = new Chess(gameState.fen).get(square);
  
        currentRow.push(
          <TouchableOpacity
            key={square}
            style={[
              styles.square,
              { backgroundColor: (x + y) % 2 ? '#769656' : '#eeeed2' },
              selectedSquare === square && styles.selected
            ]}
            onPress={() => handleSquarePress(square)}
            disabled={!playerColor || playerColor !== gameState.currentPlayer}
          >
            {piece && (
              <Text style={[
                styles.piece,
                { color: piece.color === 'w' ? '#fff' : '#000' }
              ]}>
                {getPieceSymbol({ type: piece.type, color: piece.color })}
              </Text>
            )}
          </TouchableOpacity>
        );
      }
  
      rows.push(
        <View key={y} style={styles.row}>
          {currentRow}
        </View>
      );
    }
  
    return rows;
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chess Match: {matchId}</Text>
      <Text>Your Color: {playerColor === 'w' ? 'White' : 'Black'}</Text>
      <Text>Current Player: {gameState.currentPlayer === 'w' ? 'White' : 'Black'}</Text>
      
      <View style={styles.board}>
        {renderBoard(playerColor === 'b')}
      </View>

      {promotionSquare && (
        <View style={styles.promotionContainer}>
          <Text>Promote to:</Text>
          {['q', 'r', 'b', 'n'].map((type) => (
            <TouchableOpacity
              key={type}
              style={styles.promotionButton}
              onPress={() => handlePromotion(type)}
            >
              <Text style={styles.piece}>
                {getPieceSymbol({ type, color: playerColor as 'w' | 'b' })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {gameState.isGameOver && (
        <Text style={styles.gameOver}>Game Over!</Text>
      )}
    </View>
  );
};

// Keep your existing styles, make sure to add the promotionContainer and promotionButton styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  board: {
    flexDirection: 'column',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  square: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selected: {
    borderWidth: 2,
    borderColor: 'yellow',
  },
  piece: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#ddd',
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    margin: 10,
    padding: 5,
    width: 200,
  },
  gameOver: {
    fontSize: 24,
    color: 'red',
    marginTop: 20,
  },
  promotionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 10,
  },
  promotionButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    margin: 5,
  },
});

export default ChessGame;
