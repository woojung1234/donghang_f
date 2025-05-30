class OfflineStorage {
  constructor() {
    this.dbName = 'DonghangDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 대화 로그 저장소
        if (!db.objectStoreNames.contains('conversations')) {
          const store = db.createObjectStore('conversations', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // 오프라인 가계부 데이터
        if (!db.objectStoreNames.contains('expenses')) {
          const expenseStore = db.createObjectStore('expenses', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          expenseStore.createIndex('date', 'date', { unique: false });
        }
      };
    });
  }

  // 오프라인 가계부 저장
  async saveExpenseOffline(expenseData) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['expenses'], 'readwrite');
    const store = transaction.objectStore('expenses');
    
    const data = {
      ...expenseData,
      timestamp: Date.now(),
      synced: false
    };
    
    return store.add(data);
  }

  // 대화 저장
  async saveConversation(userMessage, aiResponse) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['conversations'], 'readwrite');
    const store = transaction.objectStore('conversations');
    
    const data = {
      userMessage,
      aiResponse,
      timestamp: Date.now()
    };
    
    return store.add(data);
  }

  // 동기화할 데이터 가져오기
  async getUnsyncedExpenses() {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['expenses'], 'readonly');
    const store = transaction.objectStore('expenses');
    const request = store.getAll();
    
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const unsynced = request.result.filter(item => !item.synced);
        resolve(unsynced);
      };
    });
  }

  // 동기화 완료 표시
  async markAsSynced(id) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['expenses'], 'readwrite');
    const store = transaction.objectStore('expenses');
    const getRequest = store.get(id);
    
    return new Promise((resolve) => {
      getRequest.onsuccess = () => {
        const data = getRequest.result;
        data.synced = true;
        store.put(data);
        resolve();
      };
    });
  }
}

export default new OfflineStorage();