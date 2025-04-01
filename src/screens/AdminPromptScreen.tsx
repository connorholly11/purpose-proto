import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  StyleSheet, 
  Button,
  ActivityIndicator,
  Platform
} from 'react-native';
import { ToggleButton } from 'react-native-paper';
import { useApi } from '../hooks/useApi';

// Type for the system prompt
type SystemPrompt = {
  id: string;
  name: string;
  promptText: string;
  isActive: boolean;
  modelName?: string; // <-- We'll edit this
  createdAt: string;
  updatedAt: string;
};

const AdminPromptScreen = () => {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [name, setName] = useState('');
  const [promptText, setPromptText] = useState('');
  const [modelName, setModelName] = useState('gpt-4o'); // <-- New field
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const api = useApi();
  
  const loadPrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedPrompts = await api.admin.getSystemPrompts();
      setPrompts(fetchedPrompts);
    } catch (err) {
      setError('Failed to load prompts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadPrompts();
  }, []);
  
  const handleActivate = async (id: string) => {
    try {
      setLoading(true);
      await api.admin.setActiveSystemPrompt(id);
      setPrompts(prompts.map(prompt => ({
        ...prompt,
        isActive: prompt.id === id
      })));
    } catch (err) {
      setError('Failed to activate prompt');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreate = () => {
    setEditingPrompt(null);
    setName('');
    setPromptText('');
    setModelName('gpt-4o');
    setModalVisible(true);
  };
  
  const handleEdit = (prompt: SystemPrompt) => {
    setEditingPrompt(prompt);
    setName(prompt.name);
    setPromptText(prompt.promptText);
    setModelName(prompt.modelName || 'gpt-4o');
    setModalVisible(true);
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      
      if (editingPrompt) {
        await api.admin.updateSystemPrompt(editingPrompt.id, {
          name,
          promptText,
          modelName,
        });
      } else {
        await api.admin.createSystemPrompt(name, promptText, modelName);
      }
      
      await loadPrompts();
      setModalVisible(false);
    } catch (err) {
      setError(`Failed to ${editingPrompt ? 'update' : 'create'} prompt`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!editingPrompt) return;
    
    try {
      setLoading(true);
      await api.admin.deleteSystemPrompt(editingPrompt.id);
      await loadPrompts();
      setModalVisible(false);
      setDeleteConfirmVisible(false);
    } catch (err) {
      setError('Failed to delete prompt');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const renderPromptItem = ({ item }: { item: SystemPrompt }) => (
    <View style={styles.promptItem}>
      <View style={styles.promptHeader}>
        <Text style={styles.promptName}>{item.name}</Text>
        {item.isActive && <Text style={styles.activeTag}>ACTIVE</Text>}
      </View>
      
      <Text style={styles.promptText} numberOfLines={3}>
        {item.promptText}
      </Text>
      <Text style={styles.promptModel}>
        Model: {item.modelName || 'gpt-4o'}
      </Text>
      
      <View style={styles.promptActions}>
        <TouchableOpacity 
          onPress={() => handleEdit(item)} 
          style={styles.actionButton}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        {!item.isActive && (
          <TouchableOpacity 
            onPress={() => handleActivate(item.id)} 
            style={[styles.actionButton, styles.activateButton]}
          >
            <Text style={styles.actionButtonText}>Activate</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Prompts</Text>
        <TouchableOpacity 
          onPress={handleCreate} 
          style={styles.createButton}
        >
          <Text style={styles.createButtonText}>Create New</Text>
        </TouchableOpacity>
      </View>
      
      {loading && <ActivityIndicator size="large" style={styles.loader} />}
      
      {error && <Text style={styles.error}>{error}</Text>}
      
      <FlatList
        data={prompts}
        keyExtractor={item => item.id}
        renderItem={renderPromptItem}
        contentContainerStyle={styles.list}
      />
      
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Prompt Name"
              value={name}
              onChangeText={setName}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Prompt Text"
              value={promptText}
              onChangeText={setPromptText}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />

            <View style={styles.modelSelectorContainer}>
              <Text style={styles.modelSelectorLabel}>Select Model:</Text>
              <ToggleButton.Row 
                onValueChange={value => value && setModelName(value)}
                value={modelName}
                style={styles.toggleButtonRow}
              >
                <ToggleButton icon={() => <Text>GPT-4o</Text>} value="gpt-4o" style={styles.toggleButton} />
                <ToggleButton icon={() => <Text>Sonnet 3.5</Text>} value="claude-3-5-sonnet-20241022" style={styles.toggleButton} />
              </ToggleButton.Row>
            </View>
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setModalVisible(false)}
                color="#666"
              />
              <Button
                title="Save"
                onPress={handleSave}
                disabled={!name || !promptText || loading}
              />
              {editingPrompt && (
                <Button
                  title="Delete"
                  onPress={() => setDeleteConfirmVisible(true)}
                  color="#dc3545"
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.confirmModalContent]}>
            <Text style={styles.confirmTitle}>Delete System Prompt</Text>
            <Text style={styles.confirmText}>
              Are you sure you want to delete "{editingPrompt?.name}"?
              This action cannot be undone.
            </Text>
            
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => setDeleteConfirmVisible(false)}
              >
                <Text style={styles.confirmButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Text style={styles.confirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AdminPromptScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    paddingBottom: 20,
  },
  promptItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }
      : {}),
    ...(Platform.OS === 'android'
      ? {
          elevation: 3,
        }
      : {}),
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }
      : {}),
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  promptName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  activeTag: {
    backgroundColor: '#28a745',
    color: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  promptText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  promptModel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  promptActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#6c757d',
  },
  activateButton: {
    backgroundColor: '#17a2b8',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  loader: {
    marginVertical: 20,
  },
  error: {
    color: '#dc3545',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 150,
  },
  modelSelectorContainer: {
    marginBottom: 16,
  },
  modelSelectorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  toggleButtonRow: {
    justifyContent: 'center',
  },
  toggleButton: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  confirmModalContent: {
    padding: 16,
    maxWidth: 400,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#dc3545',
  },
  confirmText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
