/**
 * Mock Database Service for Testing
 * Émule PostgreSQL sans dépendre d'une base de données réelle
 * Stocke les données en mémoire et peut écrire dans JSON local
 */

const fs = require('fs');
const path = require('path');

class MockPool {
  constructor() {
    this.data = new Map();
    this.dataFile = path.join(__dirname, '../../.mockdb.json');
    this.loadFromDisk();
    this.listeners = { connect: [], error: [], query: [] };
  }

  // Charger données depuis fichier
  loadFromDisk() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const content = fs.readFileSync(this.dataFile, 'utf8');
        const parsed = JSON.parse(content);
        this.data = new Map(Object.entries(parsed));
      }
    } catch (err) {
      console.log('[MockDB] Données disque non disponibles, début à zéro');
    }
  }

  // Sauvegarder données vers fichier
  saveToDisk() {
    try {
      const obj = Object.fromEntries(this.data);
      fs.writeFileSync(this.dataFile, JSON.stringify(obj, null, 2));
    } catch (err) {
      console.error('[MockDB] Erreur sauvegarde disque:', err.message);
    }
  }

  // Mock query execution
  async query(text, values = []) {
    // Simuler délai réseau
    await new Promise(resolve => setTimeout(resolve, 10));

    // Parser requête SQL
    const upperText = text.toUpperCase();
    
    // INSERT
    if (upperText.includes('INSERT')) {
      const match = text.match(/INSERT INTO (\w+)/i);
      const table = match ? match[1] : 'unknown';
      
      if (!this.data.has(table)) {
        this.data.set(table, []);
      }
      
      const id = Math.random().toString(36).substr(2, 9);
      const row = { id, ...this.parseInsertValues(text, values) };
      this.data.get(table).push(row);
      this.saveToDisk();
      
      return { rows: [row], rowCount: 1 };
    }

    // SELECT
    if (upperText.includes('SELECT')) {
      const match = text.match(/FROM (\w+)/i);
      const table = match ? match[1] : null;
      
      if (!table || !this.data.has(table)) {
        return { rows: [], rowCount: 0 };
      }
      
      let rows = [...this.data.get(table)];
      
      // Appliquer WHERE (simple)
      if (text.includes('WHERE')) {
        const whereMatch = text.match(/WHERE\s+(\w+)\s*=\s*\$\d+/i);
        if (whereMatch && values.length > 0) {
          const column = whereMatch[1];
          const value = values[0];
          rows = rows.filter(row => row[column] == value);
        }
      }
      
      return { rows, rowCount: rows.length };
    }

    // UPDATE
    if (upperText.includes('UPDATE')) {
      const match = text.match(/UPDATE (\w+)/i);
      const table = match ? match[1] : null;
      
      if (!table || !this.data.has(table)) {
        return { rows: [], rowCount: 0 };
      }
      
      const rows = this.data.get(table);
      
      // UPDATE simple (premiers WHERE = $1)
      if (text.includes('WHERE')) {
        const whereMatch = text.match(/WHERE\s+id\s*=\s*\$\d+/i);
        if (whereMatch && values.length > 0) {
          const id = values[values.length - 1];
          const idx = rows.findIndex(r => r.id == id);
          if (idx !== -1) {
            rows[idx] = { ...rows[idx], ...this.parseInsertValues(text, values.slice(0, -1)) };
            this.saveToDisk();
            return { rows: [rows[idx]], rowCount: 1 };
          }
        }
      }
      
      return { rows: [], rowCount: 0 };
    }

    // DELETE
    if (upperText.includes('DELETE')) {
      const match = text.match(/FROM (\w+)/i);
      const table = match ? match[1] : null;
      
      if (!table || !this.data.has(table)) {
        return { rows: [], rowCount: 0 };
      }
      
      const rows = this.data.get(table);
      const initialLength = rows.length;
      
      if (text.includes('WHERE') && values.length > 0) {
        const whereMatch = text.match(/WHERE\s+id\s*=\s*\$\d+/i);
        if (whereMatch) {
          const id = values[0];
          const idx = rows.findIndex(r => r.id == id);
          if (idx !== -1) {
            rows.splice(idx, 1);
            this.saveToDisk();
            return { rows: [], rowCount: 1 };
          }
        }
      }
      
      return { rows: [], rowCount: initialLength - rows.length };
    }

    return { rows: [], rowCount: 0 };
  }

  parseInsertValues(text, values) {
    const result = {};
    const columnMatch = text.match(/\((.*?)\)\s*VALUES/i);
    if (columnMatch) {
      const columns = columnMatch[1].split(',').map(c => c.trim());
      columns.forEach((col, idx) => {
        result[col] = values[idx];
      });
    }
    return result;
  }

  on(event, listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  async end() {
    this.saveToDisk();
    console.log('[MockDB] Fermeture - données sauvegardées');
  }

  connect() {
    return this;
  }

  release() {}
}

module.exports = new MockPool();
