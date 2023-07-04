import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';

import Task from './components/Task';

export default function App() {
  const [task, setTask] = useState('');
  const [taskItems, setTaskItems] = useState([]);
  const [recording, setRecording] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [sound, setSound] = useState(null);

  const saveTasks = async (tasks) => {
    try {
      const jsonTasks = JSON.stringify(tasks);
      await FileSystem.writeAsStringAsync(getTasksFilePath(), jsonTasks, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const loadTasks = async () => {
    try {
      const fileUri = getTasksFilePath();
      const { exists } = await FileSystem.getInfoAsync(fileUri);
      if (exists) {
        const jsonTasks = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const tasks = JSON.parse(jsonTasks);
        setTaskItems(tasks);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddTask = async () => {
    if (task.trim() === '' || audioFile === null) {
      Alert.alert('Erreur', 'Veuillez entrer du texte et enregistrer un audio avant de sauvegarder une tâche.');
      return;
    }

    const newTask = task;
    setTaskItems([...taskItems, { text: newTask, audio: audioFile }]);
    setTask('');
    setAudioFile(null);

    await saveTasks([...taskItems, { text: newTask, audio: audioFile }]);
  };

  const deleteTask = async (index) => {
    let itemsCopy = [...taskItems];
    itemsCopy.splice(index, 1);
    setTaskItems(itemsCopy);

    await saveTasks(itemsCopy);
  };

  const confirmDelete = (index) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cette tâche?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteTask(index) },
      ],
      { cancelable: true }
    );
  };

  const getTasksFilePath = () => {
    return `${FileSystem.documentDirectory}tasks.json`;
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
    } catch (error) {
      console.log(error);
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioFile(uri);
      setRecording(null);
      await saveAudioToLibrary(uri);
    } catch (error) {
      console.log(error);
    }
  };

  const saveAudioToLibrary = async (uri) => {
    try {
      await MediaLibrary.saveToLibraryAsync(uri);
    } catch (error) {
      console.log(error);
    }
  };

  const askPermissions = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission not granted');
        return;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const playSound = async (uri) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.log(error);
    }
  };

  const pauseSound = async () => {
    if (sound) {
      await sound.pauseAsync();
    }
  };

  const resumeSound = async () => {
    if (sound) {
      await sound.playAsync();
    }
  };

  const handleTextChange = async (index, newText) => {
    let itemsCopy = [...taskItems];
    itemsCopy[index].text = newText;
    setTaskItems(itemsCopy);

    await saveTasks(itemsCopy);
  };

  useEffect(() => {
    askPermissions();
    loadTasks();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.tasksWrapper}>
        <Text style={styles.sectionTitle}>Today's tasks</Text>
        <View style={styles.items}>
          {taskItems.map((item, index) => (
            <View key={index} style={styles.taskContainer}>
              <View style={styles.taskTextContainer}>
                <TextInput
                  style={styles.taskText}
                  value={item.text}
                  onChangeText={(newText) => handleTextChange(index, newText)}
                />
              </View>
              <View style={styles.taskOptions}>
                <TouchableOpacity onPress={() => playSound(item.audio)}>
                  <Text style={styles.audioButton}>Play</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={pauseSound}>
                  <Text style={styles.audioButton}>Pause</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={resumeSound}>
                  <Text style={styles.audioButton}>Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDelete(index)}>
                  <Text style={styles.deleteButton}>X</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.writeTaskWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Write a task"
          value={task}
          onChangeText={(text) => setTask(text)}
        />
        <TouchableOpacity style={styles.recordButton} onPress={recording ? stopRecording : startRecording}>
          <Text style={styles.recordButtonText}>{recording ? 'Stop Recording' : 'Start Recording'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAddTask}>
          <View style={styles.addWrapper}>
            <Text style={styles.addText}>+</Text>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EAED',
  },
  tasksWrapper: {
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  items: {
    marginTop: 30,
  },
  taskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  taskTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  taskText: {
    backgroundColor: '#FFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C0C0C0',
  },
  taskOptions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioButton: {
    marginLeft: 10,
    padding: 5,
    borderRadius: 5,
    backgroundColor: '#FF0000',
    color: '#FFF',
  },
  deleteButton: {
    marginLeft: 10,
    padding: 5,
    borderRadius: 5,
    backgroundColor: 'red',
    color: '#FFF',
  },
  writeTaskWrapper: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  input: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#FFF',
    borderRadius: 60,
    borderColor: '#C0C0C0',
    borderWidth: 1,
    width: 250,
  },
  addWrapper: {
    width: 60,
    height: 60,
    backgroundColor: '#FFF',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#C0C0C0',
    borderWidth: 1,
  },
  addText: {},
  recordButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  recordButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
