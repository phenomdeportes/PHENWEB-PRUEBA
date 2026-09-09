/* ==========================================================================
   PHENOM STORE - BASE DE DATOS LOCAL (db.js)
   Módulo de persistencia mediante IndexedDB para evitar el límite de 5MB
   ========================================================================== */

const DB_NAME = 'PhenomStoreDB';
const DB_VERSION = 1;

// Abrir o crear la base de datos IndexedDB
function openPhenomDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Almacén para productos del catálogo
            if (!db.objectStoreNames.contains('products')) {
                db.createObjectStore('products', { keyPath: 'id' });
            }
            // Almacén para configuraciones generales del sitio
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error('Error al abrir IndexedDB:', event.target.error);
            reject(event.target.error);
        };
    });
}

// --- OPERACIONES DE PRODUCTOS ---

// Guardar lista completa de productos
async function saveAllProductsDB(productsArray) {
    try {
        const db = await openPhenomDB();
        const tx = db.transaction('products', 'readwrite');
        const store = tx.objectStore('products');

        // Limpiar productos existentes y guardar los nuevos
        await new Promise((resolve, reject) => {
            const clearReq = store.clear();
            clearReq.onsuccess = () => resolve();
            clearReq.onerror = () => reject(clearReq.error);
        });

        for (const prod of productsArray) {
            store.put(prod);
        }

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error('Error guardando productos en IndexedDB:', e);
        // Fallback a localStorage
        localStorage.setItem('phenom_products_backup', JSON.stringify(productsArray));
        return false;
    }
}

// Cargar todos los productos
async function getAllProductsDB() {
    try {
        const db = await openPhenomDB();
        const tx = db.transaction('products', 'readonly');
        const store = tx.objectStore('products');

        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.error('Error cargando productos de IndexedDB:', e);
        const backup = localStorage.getItem('phenom_products_backup');
        return backup ? JSON.parse(backup) : null;
    }
}

// --- OPERACIONES DE CONFIGURACIÓN ---

// Guardar objeto de configuraciones (fondos, títulos, hero, footer, etc.)
async function saveSettingsDB(settingsObj) {
    try {
        const db = await openPhenomDB();
        const tx = db.transaction('settings', 'readwrite');
        const store = tx.objectStore('settings');

        store.put({ key: 'site_settings', data: settingsObj });

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error('Error guardando configuraciones en IndexedDB:', e);
        localStorage.setItem('phenom_settings_backup', JSON.stringify(settingsObj));
        return false;
    }
}

// Cargar configuraciones del sitio
async function getSettingsDB() {
    try {
        const db = await openPhenomDB();
        const tx = db.transaction('settings', 'readonly');
        const store = tx.objectStore('settings');

        return new Promise((resolve, reject) => {
            const req = store.get('site_settings');
            req.onsuccess = () => resolve(req.result ? req.result.data : null);
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.error('Error cargando configuraciones de IndexedDB:', e);
        const backup = localStorage.getItem('phenom_settings_backup');
        return backup ? JSON.parse(backup) : null;
    }
}
