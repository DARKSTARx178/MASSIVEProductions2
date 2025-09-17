import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, getFirestore, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import app from '../../firebase/firebase';

interface Assignment {
  id?: string;
  title: string;
  desc: string;
  due: string;
  createdAt?: string;
  subject?: string;
}

export default function AssignmentsScreen() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [className, setClassName] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subject, setSubject] = useState('');

  // Modal & Edit states
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [editingItem, setEditingItem] = useState<Assignment | null>(null);

  // Fetch all assignments across subjects
  const fetchAssignments = async () => {
    try {
      setLoading(true);

      const db = getFirestore(app);
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');
      const uid = user.uid;

      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error('User not found');
      const userClass = userSnap.data()?.class;
      if (!userClass) throw new Error('User class not found');
      setClassName(userClass);

      const subjectsRef = collection(db, userClass);
      const subjectDocs = await getDocs(subjectsRef);
      const subjectNames = subjectDocs.docs.map((d) => d.id);
      setSubjects(subjectNames);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let allAssignments: Assignment[] = [];

      for (const subj of subjectNames) {
        const subjectRef = doc(db, userClass, subj);
        const subjectSnap = await getDoc(subjectRef);
        if (!subjectSnap.exists()) continue;

        let assignmentsMap = subjectSnap.data()?.assignments || {};

        // Delete overdue assignments (+1 day)
        let changed = false;
        for (const key of Object.keys(assignmentsMap)) {
          const a = assignmentsMap[key];
          const dueDateObj = new Date(a.due);
          dueDateObj.setDate(dueDateObj.getDate() + 1);
          if (dueDateObj < today) {
            delete assignmentsMap[key];
            changed = true;
          }
        }
        if (changed) {
          await setDoc(subjectRef, { assignments: assignmentsMap }, { merge: true });
        }

        // Add subject info and preserve the keys as `id`
        const parsed: Assignment[] = Object.entries(assignmentsMap).map(([key, a]: [string, any]) => ({
          id: key,
          ...a,
          subject: subj,
        }));

        allAssignments = allAssignments.concat(parsed);
      }

      setAssignments(allAssignments);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setAssignments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Add new assignment
  const handleAddAssignment = async () => {
    if (!subject || !title || !desc || !className) {
      alert('Please fill all fields');
      return;
    }

    try {
      const db = getFirestore(app);
      const subjectRef = doc(db, className, subject);
      const subjectSnap = await getDoc(subjectRef);

      let assignmentsMap: Record<string, Assignment> = {};
      if (subjectSnap.exists() && subjectSnap.data()?.assignments) {
        assignmentsMap = subjectSnap.data().assignments;
      }

      const newId = `assignment_${Date.now()}`;
      assignmentsMap[newId] = {
        title,
        desc,
        due: dueDate.toDateString(),
        createdAt: new Date().toISOString(),
      };

      await setDoc(subjectRef, { assignments: assignmentsMap }, { merge: true });

      alert('✅ Assignment added!');
      setModalVisible(false);
      setTitle('');
      setDesc('');
      fetchAssignments();
    } catch (err) {
      console.error('Error adding assignment:', err);
      alert('Failed to add assignment');
    }
  };

  // Delete assignment manually
  const handleDeleteAssignment = async (item: Assignment) => {
    if (!className || !item.subject) return;
    const db = getFirestore(app);
    const subjectRef = doc(db, className, item.subject);
    const subjectSnap = await getDoc(subjectRef);
    if (!subjectSnap.exists()) return;

    const assignmentsMap = subjectSnap.data()?.assignments || {};
    let keyToDelete: string | undefined = undefined;
    if (item.id && assignmentsMap[item.id]) keyToDelete = item.id
    else {
      // fallback: match by title+desc
      keyToDelete = Object.keys(assignmentsMap).find(
        (key) => assignmentsMap[key].title === item.title && assignmentsMap[key].desc === item.desc
      );
    }

    if (keyToDelete) {
      delete assignmentsMap[keyToDelete];
      await setDoc(subjectRef, { assignments: assignmentsMap }, { merge: true });
      fetchAssignments();
    }
  };

  // Edit assignment
  const handleEditAssignment = (item: Assignment) => {
    setTitle(item.title);
    setDesc(item.desc);
    setDueDate(new Date(item.due));
    setSubject(item.subject || '');
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !subject || !className) return;

    const db = getFirestore(app);
    const subjectRef = doc(db, className, subject);
    const subjectSnap = await getDoc(subjectRef);
    if (!subjectSnap.exists()) return;

    const assignmentsMap = subjectSnap.data()?.assignments || {};
    const keyToEdit = Object.keys(assignmentsMap).find(
      (key) =>
        assignmentsMap[key].title === editingItem.title &&
        assignmentsMap[key].desc === editingItem.desc
    );

    if (keyToEdit) {
      assignmentsMap[keyToEdit] = {
        title,
        desc,
        due: dueDate.toDateString(),
        createdAt: assignmentsMap[keyToEdit].createdAt,
      };
      await setDoc(subjectRef, { assignments: assignmentsMap }, { merge: true });
      fetchAssignments();
      setModalVisible(false);
      setTitle('');
      setDesc('');
      setEditingItem(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Assignments</Text>

      <FlatList
        data={assignments}
        keyExtractor={(item) => item.id || `${item.title}-${item.due}`}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.due}>Due: {item.due}</Text>
            <Text style={styles.created}>Subject: {item.subject}</Text>
            <Text style={styles.desc}>{item.desc}</Text>

            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.smallButton, { backgroundColor: '#FFA500', marginRight: 8 }]}
                onPress={() => handleEditAssignment(item)}
              >
                <Text style={styles.smallButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallButton, { backgroundColor: '#FF4C4C' }]}
                onPress={() => handleDeleteAssignment(item)}
              >
                <Text style={styles.smallButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !className
            ? <Text style={{ textAlign: 'center', marginTop: 20 }}>Not logged in</Text>
            : <Text style={{ textAlign: 'center', marginTop: 20 }}>No assignments yay</Text>
        }
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchAssignments();
        }}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>Add Assignment</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalHeader}>{editingItem ? 'Edit Assignment' : 'New Assignment'}</Text>

          <Picker selectedValue={subject} onValueChange={(itemValue) => setSubject(itemValue)}>
            <Picker.Item label="Select Subject" value="" />
            {subjects.map((subj) => (
              <Picker.Item key={subj} label={subj} value={subj} />
            ))}
          </Picker>

          <TextInput
            placeholder="Title"
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            placeholder="Description"
            style={[styles.input, { height: 80 }]}
            value={desc}
            onChangeText={setDesc}
            multiline
          />

          <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateButton}>
            <Text>Select Due Date: {dueDate.toDateString()}</Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(event, selectedDate) => {
                setShowPicker(false);
                if (selectedDate) setDueDate(selectedDate);
              }}
            />
          )}

          <Button
            title={editingItem ? 'Save Changes' : 'Add Assignment'}
            onPress={editingItem ? handleSaveEdit : handleAddAssignment}
          />
          <Button title="Cancel" color="red" onPress={() => {
            setModalVisible(false);
            setEditingItem(null);
            setTitle('');
            setDesc('');
          }} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  item: { backgroundColor: '#f2f2f2', padding: 16, borderRadius: 10, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '600' },
  due: { fontSize: 14, color: '#666', marginTop: 4 },
  created: { fontSize: 14, color: '#333', marginTop: 2 },
  desc: { fontSize: 14, color: '#333', marginTop: 6 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addButton: { backgroundColor: '#4CAF50', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalContainer: { flex: 1, padding: 20, backgroundColor: '#fff' },
  modalHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
  dateButton: { padding: 12, backgroundColor: '#eee', borderRadius: 8, marginBottom: 16 },
  smallButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  smallButtonText: { color: '#fff', fontWeight: 'bold' },
});
