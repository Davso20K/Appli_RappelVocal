import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ScrollView } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';

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

  const annuler=()=>{
    //setTask('');
    setAudioFile(null);
  }

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
      setRecording(null);
      setAudioFile(uri);
    } catch (error) {
      console.log(error);
    }
  };

  const playSound = async (audio) => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audio });
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.log(error);
    }
  };

  

  const stopSound = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView>
      <View style={styles.tasksWrapper}>
        <Text style={styles.sectionTitle}>Liste des tâches</Text>
        <View style={styles.items}>
          {taskItems.map((item, index) => {
            return (
              <Task
                key={index}
                task={item}
                onDelete={() => confirmDelete(index)}
                onPlay={() => playSound(item.audio)}
                onStop={stopSound}
              />
            );
          })}
        </View>
      </View>
      </ScrollView>
      <View style={styles.audioButtonWrapper}>
          {recording ? (
            <TouchableOpacity style={styles.stopButtoni} onPress={stopRecording}>
              <Text style={styles.buttonText}>Arrêter l'enregistrement</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.ali}>
              <TouchableOpacity style={styles.audioButton} onPress={startRecording}>
                <Text style={styles.buttonArret}>vocale </Text>
              </TouchableOpacity>
              {audioFile && (
                
                
                <TouchableOpacity style={styles.playButton} onPress={() => playSound(audioFile)}>
                  <Text style={styles.buttonLire}>Lire audio</Text>
                  
                </TouchableOpacity>
               
                
              
               
                
                
                
                
                

                
                
              )}
              <TouchableOpacity style={styles.playButton} onPress={annuler}>
                  <Text style={styles.buttonText}>X</Text>
                  
                </TouchableOpacity>

                <TouchableOpacity style={styles.playButton} onPress={rappelSonore}>
                  <Text style={styles.buttonText}>Heure</Text>
                  
                </TouchableOpacity>


              
              </View>
            </>
          )}
        </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.writeTaskWrapper}>
        <View style={styles.inputWrapper} >
        <TextInput
          style={styles.input}
          placeholder={'Ajouter une tâche'}
          value={task}
          onChangeText={(text) => setTask(text)}
        />
         <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
          <Text style={styles.addButtonLabel}>+</Text>
        </TouchableOpacity>
        </View>
       
       
      </KeyboardAvoidingView>
      
    </View>
  );
}

const Task = ({ task, onDelete, onPlay, onStop }) => {
  return (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <View style={styles.square}></View>
        <Text style={styles.itemText}>{task.text}</Text>
      </View>
      <View style={styles.itemRight}>
        <TouchableOpacity style={styles.playButton} onPress={onPlay}>
          <Text style={styles.buttonText}>Jouer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.stopButton} onPress={onStop}>
          <Text style={styles.buttonText}>Arrêter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.buttonText}>X</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  annuleBtn:{
    height:24,
    width:24,
    borderRadius:10,
    backgroundColor:'red',
    color:'white',
    
  },
  writeTaskWrapper: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  ali:{
      flexDirection: 'row',
    
      justifyContent: 'space-between',

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
  audioButtonWrapper: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop:80,
  },
  audioButton: {
    backgroundColor: '#55BCF6',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  playButton: {
    backgroundColor: '#4CC9F0',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
    margin:10,
  },
  stopButton: {
    backgroundColor: '#FF4949',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  stopButtoni:{
    backgroundColor: '#FF4949',
    padding: 10,
    
    borderRadius: 10,
    marginTop: 80,
    marginBottom: 10,
  },
  
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  buttonArret:{
    color: 'blue',
    fontWeight: 'bold',
    padding:-150,
    marginLeft:12,
  },
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
  inputWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#C0C0C0',
    backgroundColor:'#FFF',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
  },
addButton: {
    width: 50,
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonLabel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  itemText: {
    maxWidth: '80%',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  deleteButton: {
    backgroundColor: '#FF4949',
    padding: 10,
    borderRadius: 10,
    marginLeft: 10,
  },
});
