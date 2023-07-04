import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const Task = ({ text, recording }) => {
  return (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <View style={styles.square}></View>
        <Text style={styles.itemText}>{text}</Text>
      </View>
      {recording && (
        <View style={styles.recordingWrapper}>
          <Text style={styles.recordingText}>Recording Available</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  square: {
    width: 24,
    height: 24,
    backgroundColor: '#55BCF6',
    opacity: 0.4,
    borderRadius: 5,
    marginRight: 15,
  },
  itemText: {
    maxWidth: '80%',
  },
  recordingWrapper: {
    backgroundColor: '#55BCF6',
    borderRadius: 5,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  recordingText: {
    color: 'white',
    fontSize: 10,
  },
});

export default Task;
