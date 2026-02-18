const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configuración de multer para subida de archivos (usar memoria temporal)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // Límite de 10MB
});

const app = express();
const PORT = process.env.PORT || 80;

// Ruta de datos persistentes (configurable por variable de entorno para OpenShift)
const DATA_PATH = process.env.DATA_PATH || __dirname;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Almacén de proyectos registrados (estructura jerárquica)
let projectsData = { items: [] };
const projectsFilePath = path.join(DATA_PATH, 'projects.json');

// Cargar proyectos guardados al iniciar
function loadProjects() {
    try {
        if (fs.existsSync(projectsFilePath)) {
            const data = fs.readFileSync(projectsFilePath, 'utf-8');
            const parsed = JSON.parse(data);
            
            // Migrar estructura antigua (array) a nueva (objeto con items)
            if (Array.isArray(parsed)) {
                projectsData = { items: parsed.map(p => ({ type: 'project', ...p })) };
                saveProjects(); // Guardar en nuevo formato
                console.log('📦 Migrado projects.json al nuevo formato jerárquico');
            } else {
                projectsData = parsed;
            }
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        projectsData = { items: [] };
    }
}

// Guardar proyectos
function saveProjects() {
    try {
        fs.writeFileSync(projectsFilePath, JSON.stringify(projectsData, null, 2));
    } catch (error) {
        console.error('Error saving projects:', error);
    }
}

// Obtener lista plana de todos los proyectos (recursivo)
function getAllProjects(items = projectsData.items) {
    let result = [];
    for (const item of items) {
        if (item.type === 'project') {
            result.push(item);
        } else if (item.type === 'folder' && item.items) {
            result = result.concat(getAllProjects(item.items));
        }
    }
    return result;
}

// Buscar proyecto por ID en la estructura jerárquica
function findProjectById(id, items = projectsData.items) {
    for (const item of items) {
        if (item.type === 'project' && item.id === id) {
            return item;
        } else if (item.type === 'folder' && item.items) {
            const found = findProjectById(id, item.items);
            if (found) return found;
        }
    }
    return null;
}

// Eliminar item por ID de la estructura jerárquica
function removeItemById(id, items = projectsData.items) {
    for (let i = 0; i < items.length; i++) {
        if (items[i].id === id) {
            items.splice(i, 1);
            return true;
        } else if (items[i].type === 'folder' && items[i].items) {
            if (removeItemById(id, items[i].items)) return true;
        }
    }
    return false;
}

// Inicializar proyectos
loadProjects();

// ===== API ENDPOINTS =====

// Obtener estructura jerárquica de proyectos
app.get('/api/projects', (req, res) => {
    res.json(projectsData);
});

// Guardar estructura completa (para reorganización drag & drop)
app.put('/api/projects', (req, res) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Estructura inválida' });
    }
    projectsData.items = items;
    saveProjects();
    res.json({ success: true });
});

// Crear carpeta organizativa
app.post('/api/projects/folder', (req, res) => {
    const { name, parentId } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Nombre de carpeta requerido' });
    }
    
    const folder = {
        type: 'folder',
        id: 'folder-' + Date.now().toString(),
        name,
        items: []
    };
    
    if (parentId) {
        // Añadir dentro de una carpeta existente
        const addToFolder = (items) => {
            for (const item of items) {
                if (item.id === parentId && item.type === 'folder') {
                    item.items.push(folder);
                    return true;
                } else if (item.type === 'folder' && item.items) {
                    if (addToFolder(item.items)) return true;
                }
            }
            return false;
        };
        
        if (!addToFolder(projectsData.items)) {
            return res.status(404).json({ error: 'Carpeta padre no encontrada' });
        }
    } else {
        // Añadir al nivel raíz
        projectsData.items.push(folder);
    }
    
    saveProjects();
    res.json(folder);
});

// Renombrar carpeta organizativa
app.patch('/api/projects/folder/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Nombre requerido' });
    }
    
    const renameFolder = (items) => {
        for (const item of items) {
            if (item.id === id && item.type === 'folder') {
                item.name = name;
                return true;
            } else if (item.type === 'folder' && item.items) {
                if (renameFolder(item.items)) return true;
            }
        }
        return false;
    };
    
    if (!renameFolder(projectsData.items)) {
        return res.status(404).json({ error: 'Carpeta no encontrada' });
    }
    
    saveProjects();
    res.json({ success: true });
});

// Eliminar carpeta organizativa (mueve proyectos al nivel superior)
app.delete('/api/projects/folder/:id', (req, res) => {
    const { id } = req.params;
    
    const deleteFolder = (items, parent = null, parentIndex = -1) => {
        for (let i = 0; i < items.length; i++) {
            if (items[i].id === id && items[i].type === 'folder') {
                const folder = items[i];
                // Mover contenido al nivel actual
                items.splice(i, 1, ...(folder.items || []));
                return true;
            } else if (items[i].type === 'folder' && items[i].items) {
                if (deleteFolder(items[i].items, items, i)) return true;
            }
        }
        return false;
    };
    
    if (!deleteFolder(projectsData.items)) {
        return res.status(404).json({ error: 'Carpeta no encontrada' });
    }
    
    saveProjects();
    res.json({ success: true });
});

// Añadir un nuevo proyecto
app.post('/api/projects', (req, res) => {
    const { name, path: projectPath } = req.body;
    
    if (!name || !projectPath) {
        return res.status(400).json({ error: 'Nombre y ruta son requeridos' });
    }

    // Verificar que la ruta existe
    if (!fs.existsSync(projectPath)) {
        return res.status(400).json({ error: 'La ruta especificada no existe' });
    }

    // Verificar si ya existe
    const allProjects = getAllProjects();
    const exists = allProjects.some(p => p.path === projectPath);
    if (exists) {
        return res.status(400).json({ error: 'Este proyecto ya está registrado' });
    }

    const project = {
        type: 'project',
        id: Date.now().toString(),
        name,
        path: projectPath
    };

    projectsData.items.push(project);
    saveProjects();
    res.json(project);
});

// Eliminar un proyecto
app.delete('/api/projects/:id', (req, res) => {
    const { id } = req.params;
    removeItemById(id);
    saveProjects();
    res.json({ success: true });
});

// Subir archivos a una carpeta de un proyecto (múltiples)
app.post('/api/projects/:id/upload', upload.array('files', 20), (req, res) => {
    const { id } = req.params;
    const { folderPath } = req.body;
    
    const project = findProjectById(id);
    
    if (!project) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No se han enviado archivos' });
    }

    const targetDir = path.join(project.path, folderPath);
    
    // Verificar que la carpeta destino está dentro del proyecto (seguridad)
    if (!targetDir.startsWith(project.path)) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Verificar que la carpeta destino existe
    if (!fs.existsSync(targetDir)) {
        return res.status(400).json({ error: 'La carpeta destino no existe' });
    }

    const uploadedFiles = [];
    const errors = [];
    
    try {
        for (const file of req.files) {
            const destPath = path.join(targetDir, file.originalname);
            try {
                fs.writeFileSync(destPath, file.buffer);
                uploadedFiles.push(file.originalname);
            } catch (err) {
                errors.push(file.originalname);
            }
        }
        
        if (uploadedFiles.length === 0) {
            return res.status(500).json({ error: 'No se pudo subir ningún archivo' });
        }
        
        res.json({ 
            success: true, 
            uploadedFiles,
            errors,
            count: uploadedFiles.length
        });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ error: 'Error al subir los archivos' });
    }
});

// Eliminar archivo o carpeta de un proyecto
app.delete('/api/projects/:id/file', (req, res) => {
    const { id } = req.params;
    const { filePath } = req.body;
    
    const project = findProjectById(id);
    
    if (!project) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    if (!filePath) {
        return res.status(400).json({ error: 'No se ha especificado la ruta' });
    }

    const targetPath = path.join(project.path, filePath);
    
    // Verificar que el archivo/carpeta está dentro del proyecto (seguridad)
    if (!targetPath.startsWith(project.path)) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Verificar que existe
    if (!fs.existsSync(targetPath)) {
        return res.status(404).json({ error: 'El archivo o carpeta no existe' });
    }

    try {
        const stats = fs.statSync(targetPath);
        
        if (stats.isDirectory()) {
            // Eliminar carpeta recursivamente
            fs.rmSync(targetPath, { recursive: true, force: true });
        } else {
            // Eliminar archivo
            fs.unlinkSync(targetPath);
        }
        
        res.json({ 
            success: true, 
            deleted: filePath,
            type: stats.isDirectory() ? 'folder' : 'file'
        });
    } catch (error) {
        console.error('Error deleting file/folder:', error);
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

// Obtener estructura de archivos de un proyecto
app.get('/api/projects/:id/tree', (req, res) => {
    const { id } = req.params;
    const project = findProjectById(id);
    
    if (!project) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    try {
        const tree = buildFileTree(project.path, project.path);
        res.json(tree);
    } catch (error) {
        res.status(500).json({ error: 'Error al leer la estructura del proyecto' });
    }
});

// Buscar texto en archivos de un proyecto
app.get('/api/projects/:id/search', (req, res) => {
    const { id } = req.params;
    const { q } = req.query;
    
    const project = findProjectById(id);
    
    if (!project) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    if (!q || q.trim().length === 0) {
        return res.status(400).json({ error: 'Texto de búsqueda requerido' });
    }

    const searchTerm = q.toLowerCase();
    const matchingFiles = [];
    const searchableExtensions = ['.java', '.js', '.ts', '.md', '.yml', '.yaml', '.drawio'];

    function searchInDirectory(dirPath, relativePath = '') {
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const itemRelativePath = relativePath ? `${relativePath}/${item}` : item;
                
                try {
                    const stats = fs.statSync(fullPath);
                    
                    if (stats.isDirectory()) {
                        searchInDirectory(fullPath, itemRelativePath);
                    } else {
                        const ext = path.extname(item).toLowerCase();
                        if (searchableExtensions.includes(ext)) {
                            try {
                                const content = fs.readFileSync(fullPath, 'utf8');
                                if (content.toLowerCase().includes(searchTerm)) {
                                    matchingFiles.push(itemRelativePath);
                                }
                            } catch (readError) {
                                // Ignorar archivos que no se pueden leer
                            }
                        }
                    }
                } catch (statError) {
                    // Ignorar errores de stat
                }
            }
        } catch (error) {
            // Ignorar errores de lectura de directorio
        }
    }

    searchInDirectory(project.path);
    
    res.json({ 
        searchTerm: q,
        matchingFiles,
        count: matchingFiles.length
    });
});

// Construir árbol de archivos
function buildFileTree(basePath, currentPath, relativePath = '') {
    const items = [];
    
    try {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
            
            if (entry.isDirectory()) {
                // Ignorar carpetas node_modules, .git, target, docs, etc.
                if (['node_modules', '.git', 'target', '.idea', 'build', 'docs'].includes(entry.name)) {
                    continue;
                }
                
                // Carpeta swagger se muestra pero con icono especial
                const isSwaggerFolder = entry.name === 'swagger';
                
                const children = buildFileTree(basePath, fullPath, relPath);
                
                // Verificar si es una carpeta docs
                const isDocsFolder = entry.name === 'docs';
                
                items.push({
                    name: entry.name,
                    type: 'folder',
                    path: relPath,
                    isDocsFolder,
                    isSwaggerFolder,
                    children
                });
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                
                // Solo incluir archivos Java, JavaScript, TypeScript, Markdown, YAML (swagger) y DrawIO
                if (['.java', '.js', '.ts', '.md', '.yml', '.yaml', '.drawio'].includes(ext)) {
                    let fileType = 'markdown';
                    if (ext === '.java') fileType = 'java';
                    else if (ext === '.js') fileType = 'javascript';
                    else if (ext === '.ts') fileType = 'typescript';
                    else if (ext === '.yml' || ext === '.yaml') fileType = 'swagger';
                    else if (ext === '.drawio') fileType = 'drawio';
                    
                    const item = {
                        name: entry.name,
                        type: 'file',
                        path: relPath,
                        fileType
                    };
                    
                    // Si es un archivo de código, buscar su documentación
                    if (['.java', '.js', '.ts'].includes(ext)) {
                        const docPath = findDocumentation(currentPath, entry.name, ext);
                        if (docPath) {
                            item.docPath = docPath;
                        }
                    }
                    
                    // Si es un archivo MD, buscar el archivo de código correspondiente
                    if (ext === '.md') {
                        const sourcePath = findSourceFile(basePath, currentPath, entry.name);
                        if (sourcePath) {
                            item.sourcePath = sourcePath;
                        }
                    }
                    
                    items.push(item);
                }
            }
        }
    } catch (error) {
        console.error('Error reading directory:', currentPath, error);
    }
    
    // Ordenar: carpetas primero, luego archivos
    items.sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
    });
    
    return items;
}

// Buscar documentación para un archivo de código (Java, JS, TS)
function findDocumentation(currentPath, fileName, ext) {
    const baseName = fileName.replace(ext, '');
    const docsPath = path.join(currentPath, 'docs', `${baseName}.md`);
    
    if (fs.existsSync(docsPath)) {
        const relativePath = path.relative(currentPath, docsPath);
        return path.join(path.dirname(currentPath), path.basename(currentPath), relativePath).split(path.sep).join('/');
    }
    
    return null;
}

// Buscar archivo de código correspondiente a un MD (Java, JS, TS)
function findSourceFile(basePath, currentPath, mdFileName) {
    const baseName = mdFileName.replace('.md', '');
    
    // Si estamos en una carpeta docs, buscar en el directorio padre
    if (path.basename(currentPath) === 'docs') {
        const parentPath = path.dirname(currentPath);
        
        // Buscar en orden: .java, .js, .ts
        const extensions = ['.java', '.js', '.ts'];
        for (const ext of extensions) {
            const sourcePath = path.join(parentPath, `${baseName}${ext}`);
            if (fs.existsSync(sourcePath)) {
                return path.relative(basePath, sourcePath).split(path.sep).join('/');
            }
        }
    }
    
    return null;
}

// Obtener contenido de un archivo
app.get('/api/projects/:id/file', (req, res) => {
    const { id } = req.params;
    const { path: filePath } = req.query;
    
    const project = findProjectById(id);
    
    if (!project) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    if (!filePath) {
        return res.status(400).json({ error: 'Ruta de archivo requerida' });
    }

    const fullPath = path.join(project.path, filePath);
    
    // Verificar que el archivo está dentro del proyecto (seguridad)
    if (!fullPath.startsWith(project.path)) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const ext = path.extname(filePath).toLowerCase();
        
        let fileType = 'markdown';
        if (ext === '.java') fileType = 'java';
        else if (ext === '.js') fileType = 'javascript';
        else if (ext === '.ts') fileType = 'typescript';
        else if (ext === '.yml' || ext === '.yaml') fileType = 'swagger';
        else if (ext === '.drawio') fileType = 'drawio';
        
        res.json({
            content,
            fileType,
            fileName: path.basename(filePath)
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al leer el archivo' });
    }
});

// Servir archivo raw (para uso en iframes externos como diagrams.net)
app.get('/api/projects/:id/raw', (req, res) => {
    const { id } = req.params;
    const { path: filePath } = req.query;
    
    const project = findProjectById(id);
    
    if (!project) {
        return res.status(404).send('Proyecto no encontrado');
    }

    if (!filePath) {
        return res.status(400).send('Ruta de archivo requerida');
    }

    const fullPath = path.join(project.path, filePath);
    
    // Verificar que el archivo está dentro del proyecto (seguridad)
    if (!fullPath.startsWith(project.path)) {
        return res.status(403).send('Acceso denegado');
    }

    try {
        const ext = path.extname(filePath).toLowerCase();
        
        // Configurar content-type según extensión
        const mimeTypes = {
            '.drawio': 'application/xml',
            '.xml': 'application/xml',
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg'
        };
        
        const contentType = mimeTypes[ext] || 'text/plain';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        res.sendFile(fullPath);
    } catch (error) {
        res.status(500).send('Error al leer el archivo');
    }
});

// Buscar documentación de un archivo de código (Java, JS, TS)
app.get('/api/projects/:id/doc', (req, res) => {
    const { id } = req.params;
    const { sourcePath } = req.query;
    // Mantener compatibilidad con javaPath
    const filePath = sourcePath || req.query.javaPath;
    
    const project = findProjectById(id);
    
    if (!project) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    if (!filePath) {
        return res.status(400).json({ error: 'Ruta de archivo de código requerida' });
    }

    // Construir ruta al MD - detectar extensión automáticamente
    const sourceDir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const sourceName = path.basename(filePath, ext);
    const mdRelativePath = path.join(sourceDir, 'docs', `${sourceName}.md`);
    const mdFullPath = path.join(project.path, mdRelativePath);

    try {
        if (fs.existsSync(mdFullPath)) {
            const content = fs.readFileSync(mdFullPath, 'utf-8');
            res.json({
                content,
                path: mdRelativePath.split(path.sep).join('/'),
                fileName: `${sourceName}.md`
            });
        } else {
            res.status(404).json({ error: 'Documentación no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al leer la documentación' });
    }
});

// Servir la aplicación principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    const allProjects = getAllProjects();
    console.log(`\n🚀 Servidor de documentación iniciado en http://localhost:${PORT}`);
    console.log(`📁 Datos persistentes en: ${DATA_PATH}`);
    console.log(`\n📂 Proyectos registrados: ${allProjects.length}`);
    allProjects.forEach(p => console.log(`   - ${p.name}: ${p.path}`));
    console.log('\n');
});
