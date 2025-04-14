import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { io } from 'socket.io-client';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

const socket = io('http://192.168.0.161:3001'); // Replace with your server's IP

const Explore = () => {
  const navigation = useNavigation(); // Use useNavigation to get access to navigation
  const [matches, setMatches] = useState<string[]>([]);
  socket.on('matchJoined', (matchId) => {
    setMatchId(matchId);
    setIsHost(false);
    setPlayerColor('b'); // Player 2 is black
  });
  useEffect(() => {
    // Listen for updates on match list
    socket.on('matchList', (matchIds: string[]) => {
      setMatches(matchIds);
    });

    // Request current available matches when component mounts
    socket.emit('getMatches');

    // Cleanup on unmount
    return () => {
      socket.off('matchList');
    };
  }, []);

  const handleJoinMatch = (matchId: string) => {
    socket.emit('joinMatch', matchId);

    // Listen for 'matchJoined' event from the server
    socket.on('matchJoined', (id: string) => {
      // On successful join, navigate to the game screen
      navigation.navigate('Index', { matchId: id });
    });

    // Handle error messages
    socket.on('error', (message: string) => {
      Alert.alert('Error', message);
    });
  };

  useEffect(() => {
    // Listen for new match created
    socket.on('matchCreated', (newMatchId: string) => {
      // After creating a match, fetch the updated list of matches
      socket.emit('getMatches');
    });

    // Cleanup on unmount
    return () => {
      socket.off('matchCreated');
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Matches</Text>

      <FlatList
        data={matches}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleJoinMatch(item)}
          >
            <Text style={styles.buttonText}>Join Match {item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default Explore;
