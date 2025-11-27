
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Límite alto para importaciones grandes

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Asegurar que existe el directorio de datos
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Datos Iniciales
const INITIAL_DATA = {
  families: [],
  users: [
    { username: 'MPM', password: 'R2d2c3po', name: 'Super Administrador', role: 'SUPERADMIN' },
    { username: 'admin', password: 'Pimiento', name: 'Administrador', role: 'ADMIN' },
    { username: 'usuario', password: 'agustinos', name: 'Usuario Lector', role: 'USER' }
  ]
};

// Helper: Leer BD
const readDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2));
    return INITIAL_DATA;
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return INITIAL_DATA;
  }
};

// Helper: Escribir BD
const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// --- RUTAS API ---

// 1. Obtener todas las familias
app.get('/api/families', (req, res) => {
  const db = readDb();
  res.json(db.families);
});

// 2. Guardar familia (Crear o Actualizar)
app.post('/api/families', (req, res) => {
  const db = readDb();
  const newFamily = req.body;
  
  const index = db.families.findIndex(f => f.id === newFamily.id);
  if (index >= 0) {
    db.families[index] = newFamily;
  } else {
    db.families.push(newFamily);
  }
  
  writeDb(db);
  res.json({ success: true, family: newFamily });
});

// 3. Eliminar familia
app.delete('/api/families/:id', (req, res) => {
  const db = readDb();
  db.families = db.families.filter(f => f.id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});

// 4. Obtener siguiente número de socio (lógica servidor)
app.get('/api/next-membership-number', (req, res) => {
  const db = readDb();
  if (db.families.length === 0) return res.json({ number: '001' });

  const max = db.families.reduce((acc, curr) => {
    const val = curr.membershipNumber ? parseInt(curr.membershipNumber, 10) : 0;
    const safeNum = isNaN(val) ? 0 : val;
    return Math.max(acc, safeNum);
  }, 0);

  const next = (max + 1).toString().padStart(3, '0');
  res.json({ number: next });
});

// 5. Gestión de Usuarios: Obtener
app.get('/api/users', (req, res) => {
  const db = readDb();
  res.json(db.users);
});

// 6. Gestión de Usuarios: Guardar
app.post('/api/users', (req, res) => {
  const db = readDb();
  const newUser = req.body;
  const index = db.users.findIndex(u => u.username === newUser.username);
  if (index >= 0) {
    db.users[index] = newUser;
  } else {
    db.users.push(newUser);
  }
  writeDb(db);
  res.json({ success: true });
});

// 7. Gestión de Usuarios: Eliminar
app.delete('/api/users/:username', (req, res) => {
  const db = readDb();
  db.users = db.users.filter(u => u.username !== req.params.username);
  writeDb(db);
  res.json({ success: true });
});

// 8. Importación Masiva
app.post('/api/import', (req, res) => {
    const db = readDb();
    const importedFamilies = req.body.families;
    
    importedFamilies.forEach(f => {
        const idx = db.families.findIndex(existing => existing.id === f.id);
        if (idx >= 0) {
            db.families[idx] = f;
        } else {
            db.families.push(f);
        }
    });
    
    writeDb(db);
    res.json({ success: true, count: importedFamilies.length });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n✅ Servidor Backend AMPA Agustinos corriendo en http://localhost:${PORT}`);
  console.log(`📁 Base de datos local: ${DB_FILE}\n`);
});
