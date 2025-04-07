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
import { useSystemPrompts, SystemPrompt } from '../context/SystemPromptContext';

const AdminPromptScreen = () => {
  const { 
    prompts, 
    loadingPrompts, 
    error: contextError, 
    loadPrompts,
    activatePrompt,
    createPrompt,
    updatePrompt,
    deletePrompt
  } = useSystemPrompts();
  
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [name, setName] = useState('');
  const [promptText, setPromptText] = useState('');
  const [modelName, setModelName] = useState('chatgpt-4o-latest');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  
  // Set local error state when context error changes
  useEffect(() => {
    if (contextError) {
      setError(contextError);
    }
  }, [contextError]);
  
  const handleActivate = async (id: string) => {
    try {
      await activatePrompt(id);
    } catch (err) {
      setError('Failed to activate prompt');
      console.error(err);
    }
  };
  
  const handleCreate = () => {
    setEditingPrompt(null);
    setName('');
    setPromptText('');
    setModelName('chatgpt-4o-latest');
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
      setError(null);
      
      if (editingPrompt) {
        await updatePrompt(editingPrompt.id, {
          name,
          promptText,
          modelName,
        });
      } else {
        await createPrompt(name, promptText, modelName);
      }
      
      setModalVisible(false);
    } catch (err) {
      setError(`Failed to ${editingPrompt ? 'update' : 'create'} prompt`);
      console.error(err);
    }
  };
  
  const handleDelete = async () => {
    if (!editingPrompt) return;
    
    try {
      setError(null);
      await deletePrompt(editingPrompt.id);
      setModalVisible(false);
      setDeleteConfirmVisible(false);
    } catch (err) {
      setError('Failed to delete prompt');
      console.error(err);
    }
  };
  
  const renderPromptItem = ({ item }: { item: SystemPrompt }) => (
    <View style={styles.promptItem}>
      <View style={styles.promptHeader}>
        <Text style={styles.promptName} numberOfLines={1}>{item.name}</Text>
        {item.isActive && <Text style={styles.activeTag}>ACTIVE</Text>}
      </View>
      
      <Text style={styles.promptText} numberOfLines={2}>
        {item.promptText}
      </Text>
      <Text style={styles.promptModel}>
        {item.modelName?.toLowerCase().includes('claude') 
          ? item.modelName 
          : item.modelName?.toLowerCase().includes('deepseek')
            ? 'DeepSeek v3'
            : 'chatgpt-4o-latest'}
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
      
      {loadingPrompts && <ActivityIndicator size="large" style={styles.loader} />}
      
      {error && <Text style={styles.error}>{error}</Text>}
      
      <FlatList
        data={prompts}
        keyExtractor={item => item.id}
        renderItem={renderPromptItem}
        contentContainerStyle={styles.list}
        numColumns={Platform.OS === 'web' ? 3 : 2}
        key={Platform.OS === 'web' ? 'grid-web' : 'grid-mobile'}
        columnWrapperStyle={styles.gridRow}
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
                <ToggleButton icon={() => <Text>ChatGPT-4o Latest</Text>} value="chatgpt-4o-latest" style={styles.toggleButton} />
                <ToggleButton icon={() => <Text>Sonnet 3.5</Text>} value="claude-3-5-sonnet-20241022" style={styles.toggleButton} />
                <ToggleButton icon={() => <Text>DeepSeek v3</Text>} value="deepseek-chat" style={styles.toggleButton} />
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
                disabled={!name || !promptText || loadingPrompts}
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
      
      <Modal
        visible={deleteConfirmVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.confirmModal]}>
            <Text style={styles.confirmText}>Are you sure you want to delete this prompt?</Text>
            <View style={styles.confirmButtons}>
              <Button
                title="Cancel"
                onPress={() => setDeleteConfirmVisible(false)}
                color="#666"
              />
              <Button
                title="Delete"
                onPress={handleDelete}
                color="#dc3545"
              />
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
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  promptItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    paddingBottom: 42,
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
          width: '31%',
        }
      : {
          width: '48%',
        }),
    maxHeight: 200,
    overflow: 'hidden',
    position: 'relative',
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  promptName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  activeTag: {
    backgroundColor: '#28a745',
    color: '#fff',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  promptText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
  },
  promptModel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  promptActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    position: 'absolute',
    bottom: 8,
    right: 8,
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
    width: '95%',
    maxWidth: 800,
    maxHeight: '90%',
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
    height: 300,
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
  confirmModal: {
    padding: 16,
    maxWidth: 400,
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
});
