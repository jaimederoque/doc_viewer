// ===== Estado de la aplicación =====
const state = {
    projects: [],
    currentProject: null,
    currentFile: null,
    currentDoc: null,
    viewMode: 'code', // 'code', 'docs', 'split', 'swagger', 'swagger-compare'
    swaggerFiles: [], // Lista de todos los archivos swagger disponibles
    isSwaggerMode: false,
    pendingPasswordAction: null, // Acción pendiente tras validar contraseña
    uploadTarget: null // Información de la carpeta destino para subir archivos
};

// ===== Elementos del DOM =====
const elements = {
    projectsList: document.getElementById('projectsList'),
    welcomeScreen: document.getElementById('welcomeScreen'),
    fileViewer: document.getElementById('fileViewer'),
    codePanel: document.getElementById('codePanel'),
    docsPanel: document.getElementById('docsPanel'),
    swaggerPanel: document.getElementById('swaggerPanel'),
    swaggerComparePanel: document.getElementById('swaggerComparePanel'),
    codeContent: document.getElementById('codeContent'),
    docsContent: document.getElementById('docsContent'),
    swaggerContent: document.getElementById('swaggerContent'),
    codeFileName: document.getElementById('codeFileName'),
    docsFileName: document.getElementById('docsFileName'),
    swaggerFileName: document.getElementById('swaggerFileName'),
    modalOverlay: document.getElementById('modalOverlay'),
    projectName: document.getElementById('projectName'),
    projectPath: document.getElementById('projectPath'),
    toastContainer: document.getElementById('toastContainer'),
    noDocs: document.getElementById('noDocs'),
    viewerContent: document.querySelector('.viewer-content'),
    // Tabs
    normalTabs: document.getElementById('normalTabs'),
    swaggerTabs: document.getElementById('swaggerTabs'),
    // Compare elements
    swaggerLeftSelect: document.getElementById('swaggerLeftSelect'),
    swaggerRightSelect: document.getElementById('swaggerRightSelect'),
    compareSwaggerBtn: document.getElementById('compareSwaggerBtn'),
    yamlLeftContent: document.getElementById('yamlLeftContent'),
    yamlRightContent: document.getElementById('yamlRightContent'),
    yamlLeftCode: document.getElementById('yamlLeftCode'),
    yamlRightCode: document.getElementById('yamlRightCode'),
    compareLeftHeader: document.getElementById('compareLeftHeader'),
    compareRightHeader: document.getElementById('compareRightHeader'),
    // Minimaps
    diffMinimapLeft: document.getElementById('diffMinimapLeft'),
    diffMinimapRight: document.getElementById('diffMinimapRight'),
    // Password modal
    passwordModalOverlay: document.getElementById('passwordModalOverlay'),
    passwordInput: document.getElementById('passwordInput'),
    passwordModalTitle: document.getElementById('passwordModalTitle'),
    // Upload modal
    uploadModalOverlay: document.getElementById('uploadModalOverlay'),
    uploadTargetPath: document.getElementById('uploadTargetPath'),
    fileInput: document.getElementById('fileInput')
};

// ===== Inicialización =====
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    setupEventListeners();
});

function setupEventListeners() {
    // Botones para añadir proyecto (con protección de contraseña)
    document.getElementById('addProjectBtn').addEventListener('click', () => {
        requestPassword('Añadir proyecto', () => {
            showModal();
        });
    });
    
    // Modal de añadir proyecto
    document.getElementById('closeModal').addEventListener('click', hideModal);
    document.getElementById('cancelBtn').addEventListener('click', hideModal);
    document.getElementById('saveProjectBtn').addEventListener('click', saveProject);
    
    // Modal de contraseña
    document.getElementById('closePasswordModal').addEventListener('click', hidePasswordModal);
    document.getElementById('cancelPasswordBtn').addEventListener('click', hidePasswordModal);
    document.getElementById('confirmPasswordBtn').addEventListener('click', validatePassword);
    elements.passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') validatePassword();
    });
    
    // Modal de subida de archivos
    document.getElementById('closeUploadModal').addEventListener('click', hideUploadModal);
    document.getElementById('cancelUploadBtn').addEventListener('click', hideUploadModal);
    document.getElementById('confirmUploadBtn').addEventListener('click', uploadFile);
    
    // Cerrar modales con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideModal();
            hidePasswordModal();
            hideUploadModal();
        }
    });
    
    // Cerrar modales al hacer clic fuera
    elements.modalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) hideModal();
    });
    elements.passwordModalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.passwordModalOverlay) hidePasswordModal();
    });
    elements.uploadModalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.uploadModalOverlay) hideUploadModal();
    });
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Botón de comparar Swagger
    elements.compareSwaggerBtn.addEventListener('click', compareSwaggers);
    
    // Toggle de tema
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Aplicar tema guardado
    initTheme();
}

// ===== Theme Functions =====
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        // Detectar preferencia del sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = prefersDark ? 'dark' : 'light';
        applyTheme(theme);
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    updateMermaidTheme(theme);
    updateHljsTheme(theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    showToast(`Tema ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`, 'success');
}

function updateHljsTheme(theme) {
    const darkTheme = document.getElementById('hljs-theme-dark');
    const lightTheme = document.getElementById('hljs-theme-light');
    
    if (darkTheme && lightTheme) {
        if (theme === 'dark') {
            darkTheme.disabled = false;
            lightTheme.disabled = true;
        } else {
            darkTheme.disabled = true;
            lightTheme.disabled = false;
        }
    }
}

function updateMermaidTheme(theme) {
    mermaid.initialize({
        startOnLoad: false,
        theme: theme === 'dark' ? 'dark' : 'default',
        themeVariables: theme === 'dark' ? {
            primaryColor: '#2f81f7',
            primaryTextColor: '#e6edf3',
            primaryBorderColor: '#30363d',
            lineColor: '#8b949e',
            secondaryColor: '#21262d',
            tertiaryColor: '#161b22',
            background: '#0d1117',
            mainBkg: '#21262d',
            secondBkg: '#161b22',
            border1: '#30363d',
            border2: '#30363d',
            fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans, Helvetica, Arial, sans-serif'
        } : {
            primaryColor: '#0969da',
            primaryTextColor: '#1f2328',
            primaryBorderColor: '#d0d7de',
            lineColor: '#656d76',
            secondaryColor: '#f6f8fa',
            tertiaryColor: '#eaeef2',
            background: '#ffffff',
            mainBkg: '#f6f8fa',
            secondBkg: '#eaeef2',
            border1: '#d0d7de',
            border2: '#d0d7de',
            fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans, Helvetica, Arial, sans-serif'
        }
    });
}

// ===== API Functions =====
async function loadProjects() {
    try {
        const response = await fetch('/api/projects');
        state.projects = await response.json();
        renderProjects();
        
        if (state.projects.length === 0) {
            showWelcome();
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        showToast('Error al cargar proyectos', 'error');
    }
}

async function saveProject() {
    const name = elements.projectName.value.trim();
    const path = elements.projectPath.value.trim();
    
    if (!name || !path) {
        showToast('Por favor, completa todos los campos', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, path })
        });
        
        if (!response.ok) {
            const error = await response.json();
            showToast(error.error, 'error');
            return;
        }
        
        const project = await response.json();
        state.projects.push(project);
        renderProjects();
        hideModal();
        showToast('Proyecto añadido correctamente', 'success');
        
        // Cargar el árbol del nuevo proyecto
        loadProjectTree(project.id);
    } catch (error) {
        console.error('Error saving project:', error);
        showToast('Error al guardar el proyecto', 'error');
    }
}

async function deleteProject(id, event) {
    event.stopPropagation();
    
    requestPassword('Eliminar proyecto', async () => {
        if (!confirm('¿Estás seguro de eliminar este proyecto?')) return;
        
        try {
            await fetch(`/api/projects/${id}`, { method: 'DELETE' });
            state.projects = state.projects.filter(p => p.id !== id);
            renderProjects();
            showToast('Proyecto eliminado', 'success');
            
            if (state.projects.length === 0) {
                showWelcome();
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            showToast('Error al eliminar el proyecto', 'error');
        }
    });
}

async function loadProjectTree(projectId, options = {}) {
    const { skipReadme = false, expandFolder = null } = options;
    const treeContainer = document.getElementById(`tree-${projectId}`);
    if (!treeContainer) return;
    
    treeContainer.innerHTML = '<div class="loading">Cargando...</div>';
    
    try {
        const response = await fetch(`/api/projects/${projectId}/tree`);
        const tree = await response.json();
        
        treeContainer.innerHTML = '';
        renderTree(tree, treeContainer, projectId);
        
        // Expandir carpeta específica si se indica
        if (expandFolder) {
            expandFolderPath(projectId, expandFolder);
        }
        
        // Buscar y abrir automáticamente el README.md de documentacion (si no se omite)
        if (!skipReadme) {
            const readmePath = findReadmeInDocumentacion(tree);
            if (readmePath) {
                loadFile(projectId, readmePath, 'markdown');
            }
        }
    } catch (error) {
        console.error('Error loading tree:', error);
        treeContainer.innerHTML = '<div class="empty-tree">Error al cargar archivos</div>';
    }
}

// Expande todas las carpetas en una ruta
function expandFolderPath(projectId, folderPath) {
    const parts = folderPath.split(/[\/\\]/);
    let currentPath = '';
    
    for (const part of parts) {
        if (!part) continue;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const folderId = `${projectId}-${currentPath.replace(/[\/\\]/g, '-')}`;
        const children = document.getElementById(`folder-children-${folderId}`);
        const toggle = document.getElementById(`folder-toggle-${folderId}`);
        
        if (children && children.style.display === 'none') {
            children.style.display = 'block';
            if (toggle) toggle.classList.add('open');
        }
    }
}

// Función para buscar README.md en la carpeta documentacion
function findReadmeInDocumentacion(tree) {
    for (const item of tree) {
        if (item.type === 'folder' && item.name.toLowerCase() === 'documentacion') {
            // Buscar README.md dentro de esta carpeta
            if (item.children) {
                for (const child of item.children) {
                    if (child.type === 'file' && child.name.toLowerCase() === 'readme.md') {
                        return child.path;
                    }
                }
            }
        }
    }
    return null;
}

async function loadFile(projectId, filePath, fileType) {
    try {
        const response = await fetch(`/api/projects/${projectId}/file?path=${encodeURIComponent(filePath)}`);
        const data = await response.json();
        
        state.currentFile = { projectId, path: filePath, ...data };
        state.currentDoc = null;
        
        // Ocultar panel swagger y compare por defecto
        elements.swaggerPanel.style.display = 'none';
        elements.swaggerComparePanel.style.display = 'none';
        
        // Cambiar tabs según tipo de archivo
        if (fileType === 'swagger') {
            setSwaggerMode(true);
        } else {
            setSwaggerMode(false);
        }
        
        // Mostrar código - clase de lenguaje dinámica
        const langClass = {
            'java': 'language-java',
            'javascript': 'language-javascript',
            'typescript': 'language-typescript',
            'markdown': 'language-markdown',
            'swagger': 'language-yaml'
        }[fileType] || 'language-plaintext';
        
        elements.codeContent.className = langClass;
        elements.codeContent.textContent = data.content;
        elements.codeFileName.textContent = data.fileName;
        
        // Aplicar highlight - Eliminar atributo para forzar re-highlight
        elements.codeContent.removeAttribute('data-highlighted');
        hljs.highlightElement(elements.codeContent);
        
        // Añadir números de línea
        addLineNumbers(data.content);
        
        // Cargar documentación si es un archivo de código (Java, JS, TS)
        if (['java', 'javascript', 'typescript'].includes(fileType)) {
            await loadDocumentation(projectId, filePath);
        } else if (fileType === 'markdown') {
            // Si es un MD, mostrarlo en el panel de docs
            elements.docsContent.innerHTML = marked.parse(data.content);
            elements.docsFileName.textContent = data.fileName;
            state.currentDoc = { projectId, path: filePath, content: data.content };
            
            // Highlight code blocks
            elements.docsContent.querySelectorAll('pre code').forEach(block => {
                if (!block.classList.contains('language-mermaid') && !block.classList.contains('mermaid')) {
                    hljs.highlightElement(block);
                }
            });
            
            // Renderizar diagramas Mermaid
            await renderMermaidDiagrams(elements.docsContent);
            
            switchTab('docs');
        } else if (fileType === 'drawio') {
            // Si es un DrawIO, mostrarlo en el panel de docs con visor embebido
            await loadDrawio(data.content, data.fileName);
            switchTab('docs');
        } else if (fileType === 'swagger') {
            // Mostrar Swagger UI
            await loadSwagger(projectId, filePath, data);
        }
        
        showFileViewer();
        
        // Highlight active file in tree
        document.querySelectorAll('.tree-item.active').forEach(el => el.classList.remove('active'));
        const activeItem = document.querySelector(`[data-path="${filePath}"]`);
        if (activeItem) activeItem.classList.add('active');
        
    } catch (error) {
        console.error('Error loading file:', error);
        showToast('Error al cargar el archivo', 'error');
    }
}

async function loadDocumentation(projectId, sourcePath) {
    try {
        const response = await fetch(`/api/projects/${projectId}/doc?sourcePath=${encodeURIComponent(sourcePath)}`);
        
        if (!response.ok) {
            state.currentDoc = null;
            elements.docsContent.innerHTML = '<div class="no-docs-content"><div class="no-docs-icon">📭</div><h3>Sin documentación</h3><p>No se encontró documentación para este archivo.</p></div>';
            elements.docsFileName.textContent = 'Sin documentación';
            return;
        }
        
        const data = await response.json();
        state.currentDoc = { projectId, path: data.path, content: data.content };
        
        elements.docsContent.innerHTML = marked.parse(data.content);
        elements.docsFileName.textContent = data.fileName;
        
        // Highlight code blocks in markdown
        elements.docsContent.querySelectorAll('pre code').forEach(block => {
            if (!block.classList.contains('language-mermaid') && !block.classList.contains('mermaid')) {
                hljs.highlightElement(block);
            }
        });
        
        // Renderizar diagramas Mermaid
        await renderMermaidDiagrams(elements.docsContent);
        
    } catch (error) {
        console.error('Error loading documentation:', error);
        state.currentDoc = null;
    }
}

// ===== Render Functions =====
function renderProjects() {
    if (state.projects.length === 0) {
        elements.projectsList.innerHTML = '<div class="empty-tree">No hay proyectos</div>';
        return;
    }
    
    elements.projectsList.innerHTML = state.projects.map(project => `
        <div class="project-item" data-project-id="${project.id}">
            <div class="project-header" onclick="toggleProject('${project.id}')">
                <span class="project-toggle" id="toggle-${project.id}">▶</span>
                <span class="project-icon">📁</span>
                <span class="project-name" title="${project.path}">${project.name}</span>
                <button class="project-action-btn project-search" onclick="toggleProjectSearch('${project.id}', event)" title="Buscar">🔍</button>
                <button class="project-action-btn project-delete" onclick="deleteProject('${project.id}', event)" title="Eliminar">🗑</button>
            </div>
            <div class="project-search-bar" id="search-bar-${project.id}" style="display: none;">
                <input type="text" class="project-search-input" id="search-input-${project.id}" placeholder="Buscar en archivos...">
                <button class="project-search-btn" onclick="searchInProject('${project.id}')">Buscar</button>
                <button class="project-search-clear" onclick="clearProjectSearch('${project.id}')">×</button>
            </div>
            <div class="file-tree" id="tree-${project.id}" style="display: none;"></div>
        </div>
    `).join('');
    
    // Añadir listeners para Enter en los campos de búsqueda
    state.projects.forEach(project => {
        const input = document.getElementById(`search-input-${project.id}`);
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchInProject(project.id);
                }
            });
        }
    });
}

function renderTree(items, container, projectId, level = 0) {
    items.forEach(item => {
        const div = document.createElement('div');
        
        if (item.type === 'folder') {
            div.className = 'tree-item folder';
            
            let folderIcon = '📂';
            let iconClass = 'folder';
            if (item.isDocsFolder) {
                folderIcon = '📄';
                iconClass = 'docs-folder';
            } else if (item.isSwaggerFolder) {
                folderIcon = '🔗';
                iconClass = 'swagger-folder';
            }
            
            // ID único: combina projectId + path para evitar colisiones entre proyectos
            const folderId = `${projectId}-${item.path.replace(/[\/\\]/g, '-')}`;
            
            div.innerHTML = `
                <span class="tree-toggle" id="folder-toggle-${folderId}">▶</span>
                <span class="tree-icon ${iconClass}">${folderIcon}</span>
                <span class="tree-name">${item.name}</span>
                <div class="tree-actions">
                    <button class="tree-action-btn add-btn" title="Subir archivo">+</button>
                    <button class="tree-action-btn delete-btn" title="Eliminar carpeta">×</button>
                </div>
            `;
            
            // Click en la carpeta para expandir/contraer
            div.onclick = (e) => {
                e.stopPropagation();
                // Si el click fue en un botón de acción, no expandir
                if (e.target.classList.contains('tree-action-btn')) return;
                toggleFolder(folderId);
            };
            
            // Añadir listeners a los botones
            const addBtn = div.querySelector('.add-btn');
            addBtn.addEventListener('click', (e) => initiateUpload(projectId, item.path, e));
            
            const deleteBtn = div.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => initiateDelete(projectId, item.path, item.name, 'folder', e));
            
            container.appendChild(div);
            
            // Children container
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-children';
            childrenContainer.id = `folder-children-${folderId}`;
            childrenContainer.style.display = 'none';
            container.appendChild(childrenContainer);
            
            if (item.children && item.children.length > 0) {
                renderTree(item.children, childrenContainer, projectId, level + 1);
            }
        } else {
            div.className = 'tree-item file';
            div.dataset.path = item.path;
            
            let icon = '📝';
            let iconClass = 'markdown';
            
            if (item.fileType === 'java') {
                icon = '☕';
                iconClass = 'java';
            } else if (item.fileType === 'javascript') {
                icon = '🟡';
                iconClass = 'javascript';
            } else if (item.fileType === 'typescript') {
                icon = '🔷';
                iconClass = 'typescript';
            } else if (item.fileType === 'swagger') {
                icon = '📡';
                iconClass = 'swagger';
            } else if (item.fileType === 'drawio') {
                icon = '🖼️';
                iconClass = 'drawio';
            }
            
            const hasDoc = item.docPath ? '<span class="tree-badge">DOC</span>' : '';
            
            div.innerHTML = `
                <span class="tree-toggle" style="visibility: hidden;">▶</span>
                <span class="tree-icon ${iconClass}">${icon}</span>
                <span class="tree-name">${item.name}</span>
                ${hasDoc}
                <button class="tree-action-btn delete-btn file-delete" title="Eliminar archivo">×</button>
            `;
            div.onclick = (e) => {
                e.stopPropagation();
                if (e.target.classList.contains('tree-action-btn')) return;
                loadFile(projectId, item.path, item.fileType);
            };
            
            const deleteBtn = div.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => initiateDelete(projectId, item.path, item.name, 'file', e));
            
            container.appendChild(div);
        }
    });
}

// ===== UI Functions =====
function toggleProject(projectId) {
    const tree = document.getElementById(`tree-${projectId}`);
    const toggle = document.getElementById(`toggle-${projectId}`);
    
    if (tree.style.display === 'none') {
        tree.style.display = 'block';
        toggle.classList.add('open');
        
        // Cargar árbol si está vacío
        if (!tree.hasChildNodes() || tree.querySelector('.loading')) {
            loadProjectTree(projectId);
        }
    } else {
        tree.style.display = 'none';
        toggle.classList.remove('open');
    }
}

// Mostrar/ocultar barra de búsqueda del proyecto
function toggleProjectSearch(projectId, event) {
    event.stopPropagation();
    const searchBar = document.getElementById(`search-bar-${projectId}`);
    const tree = document.getElementById(`tree-${projectId}`);
    const toggle = document.getElementById(`toggle-${projectId}`);
    
    if (searchBar.style.display === 'none') {
        searchBar.style.display = 'flex';
        // Asegurar que el proyecto esté expandido
        if (tree.style.display === 'none') {
            tree.style.display = 'block';
            toggle.classList.add('open');
            if (!tree.hasChildNodes() || tree.querySelector('.loading')) {
                loadProjectTree(projectId);
            }
        }
        // Enfocar el input
        document.getElementById(`search-input-${projectId}`).focus();
    } else {
        searchBar.style.display = 'none';
        clearProjectSearch(projectId);
    }
}

// Buscar texto en el proyecto
async function searchInProject(projectId) {
    const input = document.getElementById(`search-input-${projectId}`);
    const searchTerm = input.value.trim();
    
    if (!searchTerm) {
        showToast('Introduce un texto para buscar', 'error');
        return;
    }
    
    const tree = document.getElementById(`tree-${projectId}`);
    
    try {
        const response = await fetch(`/api/projects/${projectId}/search?q=${encodeURIComponent(searchTerm)}`);
        const result = await response.json();
        
        if (!response.ok) {
            showToast(result.error || 'Error en la búsqueda', 'error');
            return;
        }
        
        if (result.count === 0) {
            showToast(`No se encontró "${searchTerm}" en ningún archivo`, 'info');
            return;
        }
        
        // Aplicar filtro visual al árbol
        applySearchFilter(tree, result.matchingFiles, projectId);
        
        showToast(`${result.count} archivo(s) encontrado(s)`, 'success');
    } catch (error) {
        console.error('Error searching:', error);
        showToast('Error al buscar', 'error');
    }
}

// Aplicar filtro de búsqueda al árbol
function applySearchFilter(treeContainer, matchingFiles, projectId) {
    // Marcar el contenedor con clase de búsqueda activa
    treeContainer.classList.add('search-active');
    
    // Primero, quitar todas las marcas anteriores
    treeContainer.querySelectorAll('.search-match, .search-match-parent').forEach(el => {
        el.classList.remove('search-match', 'search-match-parent');
    });
    
    // Expandir todas las carpetas y marcar archivos coincidentes
    matchingFiles.forEach(filePath => {
        const normalizedPath = filePath.replace(/\\/g, '/');
        const parts = normalizedPath.split('/');
        
        // Marcar el archivo
        const fileItem = treeContainer.querySelector(`[data-path="${filePath}"], [data-path="${normalizedPath}"]`);
        if (fileItem) {
            fileItem.classList.add('search-match');
            
            // Expandir y marcar todas las carpetas padre
            let currentPath = '';
            for (let i = 0; i < parts.length - 1; i++) {
                currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
                const folderId = `${projectId}-${currentPath.replace(/[\\/]/g, '-')}`;
                
                // Expandir la carpeta
                const folderChildren = document.getElementById(`folder-children-${folderId}`);
                const folderToggle = document.getElementById(`folder-toggle-${folderId}`);
                
                if (folderChildren) {
                    folderChildren.style.display = 'block';
                    folderChildren.classList.add('search-match-parent');
                    if (folderToggle) folderToggle.classList.add('open');
                }
                
                // Marcar el item de carpeta como padre
                const folderItem = folderToggle?.closest('.tree-item');
                if (folderItem) {
                    folderItem.classList.add('search-match-parent');
                }
            }
        }
    });
}

// Limpiar búsqueda del proyecto
function clearProjectSearch(projectId) {
    const tree = document.getElementById(`tree-${projectId}`);
    const input = document.getElementById(`search-input-${projectId}`);
    const searchBar = document.getElementById(`search-bar-${projectId}`);
    
    if (input) input.value = '';
    
    // Ocultar barra de búsqueda
    if (searchBar) searchBar.style.display = 'none';
    
    // Quitar clase de búsqueda activa
    tree.classList.remove('search-active');
    
    // Quitar todas las marcas de búsqueda
    tree.querySelectorAll('.search-match, .search-match-parent').forEach(el => {
        el.classList.remove('search-match', 'search-match-parent');
    });
}

function toggleFolder(folderId) {
    const children = document.getElementById(`folder-children-${folderId}`);
    const toggle = document.getElementById(`folder-toggle-${folderId}`);
    
    if (children) {
        if (children.style.display === 'none') {
            children.style.display = 'block';
            toggle.classList.add('open');
        } else {
            children.style.display = 'none';
            toggle.classList.remove('open');
        }
    }
}

function switchTab(tab) {
    state.viewMode = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // Update panels
    const viewerContent = document.querySelector('.viewer-content');
    viewerContent.classList.remove('split');
    
    // Ocultar todos los paneles primero
    elements.codePanel.style.display = 'none';
    elements.docsPanel.style.display = 'none';
    elements.swaggerPanel.style.display = 'none';
    elements.swaggerComparePanel.style.display = 'none';
    
    switch (tab) {
        case 'code':
            elements.codePanel.style.display = 'flex';
            break;
        case 'docs':
            elements.docsPanel.style.display = 'flex';
            break;
        case 'split':
            viewerContent.classList.add('split');
            elements.codePanel.style.display = 'flex';
            elements.docsPanel.style.display = 'flex';
            break;
        case 'swagger':
            elements.swaggerPanel.style.display = 'flex';
            break;
        case 'swagger-compare':
            elements.swaggerComparePanel.style.display = 'flex';
            populateSwaggerSelectors();
            break;
    }
}

function showModal() {
    elements.projectName.value = '';
    elements.projectPath.value = '';
    elements.modalOverlay.classList.add('show');
    elements.projectName.focus();
}

function hideModal() {
    elements.modalOverlay.classList.remove('show');
}

// ===== Modal de contraseña =====
function requestPassword(title, onSuccess) {
    state.pendingPasswordAction = onSuccess;
    elements.passwordModalTitle.textContent = title;
    elements.passwordInput.value = '';
    elements.passwordModalOverlay.classList.add('show');
    elements.passwordInput.focus();
}

function hidePasswordModal() {
    elements.passwordModalOverlay.classList.remove('show');
    state.pendingPasswordAction = null;
}

function validatePassword() {
    const password = elements.passwordInput.value;
    if (password === 'ODH123') {
        const action = state.pendingPasswordAction;
        hidePasswordModal();
        if (action) {
            action();
        }
    } else {
        showToast('Contraseña incorrecta', 'error');
        elements.passwordInput.value = '';
        elements.passwordInput.focus();
    }
}

// ===== Modal de subida de archivos =====
function showUploadModal(projectId, folderPath) {
    state.uploadTarget = { projectId, folderPath };
    elements.uploadTargetPath.textContent = folderPath || '/';
    elements.fileInput.value = '';
    elements.uploadModalOverlay.classList.add('show');
}

function hideUploadModal() {
    elements.uploadModalOverlay.classList.remove('show');
    state.uploadTarget = null;
}

async function uploadFile() {
    const files = elements.fileInput.files;
    
    if (!files || files.length === 0) {
        showToast('Selecciona al menos un archivo', 'error');
        return;
    }
    
    if (!state.uploadTarget) {
        showToast('Error: no se ha seleccionado carpeta destino', 'error');
        return;
    }
    
    const { projectId, folderPath } = state.uploadTarget;
    
    const formData = new FormData();
    for (const file of files) {
        formData.append('files', file);
    }
    formData.append('folderPath', folderPath);
    
    // Cerrar modal primero para evitar problemas de estado
    hideUploadModal();
    
    try {
        const response = await fetch(`/api/projects/${projectId}/upload`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            showToast(result.error || 'Error al subir archivos', 'error');
            return;
        }
        
        // Mostrar mensaje de éxito
        if (result.count === 1) {
            showToast(`Archivo "${result.uploadedFiles[0]}" subido correctamente`, 'success');
        } else {
            showToast(`${result.count} archivos subidos correctamente`, 'success');
        }
        
        // Recargar el árbol del proyecto y expandir la carpeta
        try {
            await loadProjectTree(projectId, { skipReadme: true, expandFolder: folderPath });
        } catch (treeError) {
            console.error('Error refreshing tree:', treeError);
        }
    } catch (error) {
        console.error('Error uploading files:', error);
        showToast('Error al subir los archivos', 'error');
    }
}

// Función para iniciar subida con contraseña
function initiateUpload(projectId, folderPath, event) {
    event.stopPropagation();
    requestPassword('Subir archivo', () => {
        showUploadModal(projectId, folderPath);
    });
}

// Función para iniciar eliminación con contraseña
function initiateDelete(projectId, filePath, fileName, type, event) {
    event.stopPropagation();
    const typeText = type === 'folder' ? 'la carpeta' : 'el archivo';
    requestPassword(`Eliminar ${typeText} "${fileName}"`, () => {
        deleteItem(projectId, filePath, fileName, type);
    });
}

// Función para eliminar archivo o carpeta
async function deleteItem(projectId, filePath, fileName, type) {
    try {
        const response = await fetch(`/api/projects/${projectId}/file`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ filePath })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            showToast(result.error || 'Error al eliminar', 'error');
            return;
        }
        
        const typeText = type === 'folder' ? 'Carpeta' : 'Archivo';
        showToast(`${typeText} "${fileName}" eliminado correctamente`, 'success');
        
        // Obtener la carpeta padre para expandirla después
        const parentFolder = filePath.split(/[\/\\]/).slice(0, -1).join('/');
        
        // Recargar el árbol del proyecto
        try {
            await loadProjectTree(projectId, { skipReadme: true, expandFolder: parentFolder });
        } catch (treeError) {
            console.error('Error refreshing tree:', treeError);
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showToast('Error al eliminar', 'error');
    }
}

function showWelcome() {
    elements.welcomeScreen.style.display = 'flex';
    elements.fileViewer.style.display = 'none';
}

function showFileViewer() {
    elements.welcomeScreen.style.display = 'none';
    elements.fileViewer.style.display = 'flex';
    elements.noDocs.style.display = 'none';
}

function addLineNumbers(content) {
    const lines = content.split('\n');
    const lineNumbersContainer = document.createElement('div');
    lineNumbersContainer.className = 'line-numbers';
    
    for (let i = 1; i <= lines.length; i++) {
        const lineNumber = document.createElement('span');
        lineNumber.textContent = i;
        lineNumbersContainer.appendChild(lineNumber);
    }
    
    // Eliminar números de línea anteriores si existen
    const existingLineNumbers = elements.codeContent.parentElement.querySelector('.line-numbers');
    if (existingLineNumbers) {
        existingLineNumbers.remove();
    }
    
    // Insertar antes del código
    elements.codeContent.parentElement.insertBefore(lineNumbersContainer, elements.codeContent);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Variable global para Swagger UI
let swaggerUIInstance = null;

// Función para mostrar/ocultar tabs según el modo
function setSwaggerMode(isSwagger) {
    state.isSwaggerMode = isSwagger;
    elements.normalTabs.style.display = isSwagger ? 'none' : 'flex';
    elements.swaggerTabs.style.display = isSwagger ? 'flex' : 'none';
}

// Función para cargar y renderizar Swagger
async function loadSwagger(projectId, filePath, data) {
    elements.swaggerFileName.textContent = data.fileName;
    
    // Cambiar a modo Swagger
    setSwaggerMode(true);
    
    // Limpiar contenedor anterior
    elements.swaggerContent.innerHTML = '';
    
    // Destruir instancia anterior si existe
    if (swaggerUIInstance) {
        swaggerUIInstance = null;
    }
    
    try {
        // Parsear YAML a JSON
        const spec = jsyaml.load(data.content);
        
        // Crear Swagger UI
        swaggerUIInstance = SwaggerUIBundle({
            spec: spec,
            dom_id: '#swaggerContent',
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.SwaggerUIStandalonePreset
            ],
            layout: 'BaseLayout',
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 1,
            docExpansion: 'list',
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
            syntaxHighlight: {
                activate: true,
                theme: 'monokai'
            }
        });
        
        // Mostrar panel swagger
        switchTab('swagger');
        
    } catch (error) {
        console.error('Error parsing swagger:', error);
        elements.swaggerContent.innerHTML = `
            <div class="swagger-error">
                <div class="swagger-error-icon">⚠️</div>
                <h3>Error al parsear el archivo Swagger</h3>
                <p>${error.message}</p>
                <pre>${data.content}</pre>
            </div>
        `;
        switchTab('swagger');
    }
}

// Función para recopilar todos los archivos Swagger de todos los proyectos
async function collectSwaggerFiles() {
    state.swaggerFiles = [];
    
    for (const project of state.projects) {
        try {
            const response = await fetch(`/api/projects/${project.id}/tree`);
            const tree = await response.json();
            findSwaggerFiles(tree, project.id, project.name);
        } catch (error) {
            console.error('Error loading project tree:', error);
        }
    }
}

// Función recursiva para encontrar archivos Swagger en el árbol
function findSwaggerFiles(items, projectId, projectName, parentPath = '') {
    for (const item of items) {
        if (item.type === 'folder' && item.children) {
            findSwaggerFiles(item.children, projectId, projectName, item.path);
        } else if (item.type === 'file' && item.fileType === 'swagger') {
            state.swaggerFiles.push({
                projectId,
                projectName,
                path: item.path,
                name: item.name
            });
        }
    }
}

// Función para popular los selectores de Swagger
async function populateSwaggerSelectors() {
    await collectSwaggerFiles();
    
    const leftSelect = elements.swaggerLeftSelect;
    const rightSelect = elements.swaggerRightSelect;
    
    // Guardar valores actuales
    const leftValue = leftSelect.value;
    const rightValue = rightSelect.value;
    
    // Limpiar selectores
    leftSelect.innerHTML = '<option value="">Seleccionar archivo...</option>';
    rightSelect.innerHTML = '<option value="">Seleccionar archivo...</option>';
    
    // Añadir opciones
    for (const file of state.swaggerFiles) {
        const optionValue = JSON.stringify({ projectId: file.projectId, path: file.path });
        const optionText = `${file.projectName} / ${file.path}`;
        
        leftSelect.innerHTML += `<option value='${optionValue}'>${optionText}</option>`;
        rightSelect.innerHTML += `<option value='${optionValue}'>${optionText}</option>`;
    }
    
    // Restaurar valores si existen
    if (leftValue) leftSelect.value = leftValue;
    if (rightValue) rightSelect.value = rightValue;
    
    // Pre-seleccionar el swagger actual en el izquierdo si existe
    if (state.currentFile && state.currentFile.fileType === 'swagger') {
        const currentValue = JSON.stringify({ 
            projectId: state.currentFile.projectId, 
            path: state.currentFile.path 
        });
        leftSelect.value = currentValue;
    }
}

// Función para comparar dos Swaggers mostrando YAML con diferencias
async function compareSwaggers() {
    const leftValue = elements.swaggerLeftSelect.value;
    const rightValue = elements.swaggerRightSelect.value;
    
    if (!leftValue || !rightValue) {
        showToast('Selecciona ambos archivos Swagger para comparar', 'error');
        return;
    }
    
    const leftData = JSON.parse(leftValue);
    const rightData = JSON.parse(rightValue);
    
    // Mostrar loading
    elements.yamlLeftCode.textContent = 'Cargando...';
    elements.yamlRightCode.textContent = 'Cargando...';
    
    try {
        // Cargar ambos archivos
        const [leftResponse, rightResponse] = await Promise.all([
            fetch(`/api/projects/${leftData.projectId}/file?path=${encodeURIComponent(leftData.path)}`),
            fetch(`/api/projects/${rightData.projectId}/file?path=${encodeURIComponent(rightData.path)}`)
        ]);
        
        const [leftFile, rightFile] = await Promise.all([
            leftResponse.json(),
            rightResponse.json()
        ]);
        
        // Actualizar headers
        elements.compareLeftHeader.textContent = leftFile.fileName;
        elements.compareRightHeader.textContent = rightFile.fileName;
        
        // Obtener líneas de cada archivo
        const leftLines = leftFile.content.split('\n');
        const rightLines = rightFile.content.split('\n');
        
        // Calcular diferencias
        const diff = computeDiff(leftLines, rightLines);
        
        // Renderizar con diferencias resaltadas
        renderDiffView(diff, leftLines, rightLines);
        
        showToast('Comparación cargada', 'success');
        
    } catch (error) {
        console.error('Error comparing swaggers:', error);
        showToast('Error al cargar los archivos Swagger', 'error');
    }
}

// Función para calcular diferencias entre dos arrays de líneas (LCS-based diff)
function computeDiff(leftLines, rightLines) {
    const m = leftLines.length;
    const n = rightLines.length;
    
    // Crear matriz LCS
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (leftLines[i - 1] === rightLines[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    
    // Backtrack para encontrar diferencias
    const result = [];
    let i = m, j = n;
    
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && leftLines[i - 1] === rightLines[j - 1]) {
            result.unshift({ type: 'equal', leftIndex: i - 1, rightIndex: j - 1 });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            result.unshift({ type: 'added', rightIndex: j - 1 });
            j--;
        } else {
            result.unshift({ type: 'removed', leftIndex: i - 1 });
            i--;
        }
    }
    
    return result;
}

// Función para renderizar la vista de diferencias
function renderDiffView(diff, leftLines, rightLines) {
    let leftHtml = '';
    let rightHtml = '';
    let leftLineNum = 0;
    let rightLineNum = 0;
    let lineIndex = 0;
    
    // Guardar información de diferencias para el minimap
    const diffMarkers = [];
    
    for (const item of diff) {
        if (item.type === 'equal') {
            const line = escapeHtml(leftLines[item.leftIndex]);
            leftHtml += `<div class="diff-line" data-line="${lineIndex}"><span class="line-num">${++leftLineNum}</span><span class="line-content">${line}</span></div>`;
            rightHtml += `<div class="diff-line" data-line="${lineIndex}"><span class="line-num">${++rightLineNum}</span><span class="line-content">${line}</span></div>`;
        } else if (item.type === 'removed') {
            const line = escapeHtml(leftLines[item.leftIndex]);
            leftHtml += `<div class="diff-line diff-removed" data-line="${lineIndex}"><span class="line-num">${++leftLineNum}</span><span class="line-content">${line}</span></div>`;
            rightHtml += `<div class="diff-line diff-empty" data-line="${lineIndex}"><span class="line-num"></span><span class="line-content"></span></div>`;
            diffMarkers.push({ lineIndex, type: 'removed' });
        } else if (item.type === 'added') {
            const line = escapeHtml(rightLines[item.rightIndex]);
            leftHtml += `<div class="diff-line diff-empty" data-line="${lineIndex}"><span class="line-num"></span><span class="line-content"></span></div>`;
            rightHtml += `<div class="diff-line diff-added" data-line="${lineIndex}"><span class="line-num">${++rightLineNum}</span><span class="line-content">${line}</span></div>`;
            diffMarkers.push({ lineIndex, type: 'added' });
        }
        lineIndex++;
    }
    
    elements.yamlLeftCode.innerHTML = leftHtml;
    elements.yamlRightCode.innerHTML = rightHtml;
    
    // Renderizar minimaps
    renderMinimap(elements.diffMinimapLeft, diffMarkers, diff.length, elements.yamlLeftContent, 'removed');
    renderMinimap(elements.diffMinimapRight, diffMarkers, diff.length, elements.yamlRightContent, 'added');
    
    // Sincronizar scroll
    setupSyncScroll(elements.yamlLeftContent, elements.yamlRightContent);
    
    // Actualizar viewport del minimap al hacer scroll
    updateMinimapViewport(elements.yamlLeftContent, elements.diffMinimapLeft, diff.length);
    updateMinimapViewport(elements.yamlRightContent, elements.diffMinimapRight, diff.length);
}

// Función para renderizar el minimap (funciona como scrollbar)
function renderMinimap(minimapElement, diffMarkers, totalLines, contentElement, highlightType) {
    minimapElement.innerHTML = '';
    
    if (totalLines === 0) return;
    
    const minimapHeight = minimapElement.clientHeight || 400;
    const lineHeight = minimapHeight / totalLines;
    
    // Agrupar marcadores consecutivos del mismo tipo
    const groups = [];
    let currentGroup = null;
    
    for (const marker of diffMarkers) {
        if (currentGroup && currentGroup.type === marker.type && marker.lineIndex === currentGroup.endLine + 1) {
            currentGroup.endLine = marker.lineIndex;
        } else {
            if (currentGroup) groups.push(currentGroup);
            currentGroup = { type: marker.type, startLine: marker.lineIndex, endLine: marker.lineIndex };
        }
    }
    if (currentGroup) groups.push(currentGroup);
    
    // Crear marcadores visuales (solo como indicadores, no clickeables)
    for (const group of groups) {
        const marker = document.createElement('div');
        marker.className = `diff-minimap-marker ${group.type}`;
        
        const top = group.startLine * lineHeight;
        const height = Math.max(3, (group.endLine - group.startLine + 1) * lineHeight);
        
        marker.style.top = `${top}px`;
        marker.style.height = `${height}px`;
        
        minimapElement.appendChild(marker);
    }
    
    // Añadir viewport indicator (arrastrable)
    const viewport = document.createElement('div');
    viewport.className = 'diff-minimap-viewport';
    viewport.id = `viewport-${minimapElement.id}`;
    minimapElement.appendChild(viewport);
    
    // Click en el minimap para navegar directamente
    minimapElement.addEventListener('click', (e) => {
        if (e.target === viewport) return; // Ignorar clicks en el viewport
        
        const rect = minimapElement.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const currentMinimapHeight = minimapElement.clientHeight;
        const scrollRatio = clickY / currentMinimapHeight;
        const maxScroll = contentElement.scrollHeight - contentElement.clientHeight;
        
        contentElement.scrollTo({
            top: scrollRatio * maxScroll,
            behavior: 'smooth'
        });
    });
    
    // Scroll con rueda del ratón sobre el minimap
    minimapElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        contentElement.scrollTop += e.deltaY;
    }, { passive: false });
    
    // Hacer el viewport arrastrable
    setupMinimapDrag(viewport, minimapElement, contentElement);
}

// Configurar arrastre del viewport del minimap
function setupMinimapDrag(viewport, minimapElement, contentElement) {
    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;
    
    viewport.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        startScrollTop = contentElement.scrollTop;
        viewport.classList.add('dragging');
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const minimapHeight = minimapElement.clientHeight;
        const contentScrollHeight = contentElement.scrollHeight;
        const contentClientHeight = contentElement.clientHeight;
        const maxScroll = contentScrollHeight - contentClientHeight;
        
        // Calcular el ratio de movimiento
        const deltaY = e.clientY - startY;
        const scrollRatio = contentScrollHeight / minimapHeight;
        const newScrollTop = startScrollTop + (deltaY * scrollRatio);
        
        contentElement.scrollTop = Math.max(0, Math.min(maxScroll, newScrollTop));
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            viewport.classList.remove('dragging');
        }
    });
}

// Función para actualizar el viewport del minimap
function updateMinimapViewport(contentElement, minimapElement, totalLines) {
    const viewport = document.getElementById(`viewport-${minimapElement.id}`);
    if (!viewport || totalLines === 0) return;
    
    const updateViewport = () => {
        const minimapHeight = minimapElement.clientHeight;
        const contentScrollHeight = contentElement.scrollHeight;
        const contentClientHeight = contentElement.clientHeight;
        const scrollTop = contentElement.scrollTop;
        
        if (contentScrollHeight <= contentClientHeight) {
            viewport.style.display = 'none';
            return;
        }
        
        viewport.style.display = 'block';
        const viewportHeight = (contentClientHeight / contentScrollHeight) * minimapHeight;
        const viewportTop = (scrollTop / contentScrollHeight) * minimapHeight;
        
        viewport.style.top = `${viewportTop}px`;
        viewport.style.height = `${Math.max(20, viewportHeight)}px`;
    };
    
    contentElement.addEventListener('scroll', updateViewport);
    // Actualizar inicialmente después de un pequeño delay para que el DOM esté listo
    setTimeout(updateViewport, 100);
}

// Función para configurar sincronización de scroll bidireccional
function setupSyncScroll(element1, element2) {
    let isSyncing = false;
    
    element1.addEventListener('scroll', () => {
        if (isSyncing) {
            isSyncing = false;
            return;
        }
        isSyncing = true;
        element2.scrollTop = element1.scrollTop;
        element2.scrollLeft = element1.scrollLeft;
    });
    
    element2.addEventListener('scroll', () => {
        if (isSyncing) {
            isSyncing = false;
            return;
        }
        isSyncing = true;
        element1.scrollTop = element2.scrollTop;
        element1.scrollLeft = element2.scrollLeft;
    });
}

// Función para escapar HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Configurar marked para mejor renderizado
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true
});

// Función para decodificar contenido comprimido de DrawIO
function decodeDrawioContent(compressedData) {
    try {
        // Paso 1: Base64 decode
        const decoded = atob(compressedData);
        
        // Paso 2: Convert to Uint8Array
        const uint8Array = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
            uint8Array[i] = decoded.charCodeAt(i);
        }
        
        // Paso 3: Inflate con pako
        const inflated = pako.inflateRaw(uint8Array, { to: 'string' });
        
        // Paso 4: URL decode
        return decodeURIComponent(inflated);
    } catch (e) {
        console.error('Error decodificando DrawIO:', e);
        return null;
    }
}

// Función para comprimir contenido para el visor de DrawIO
function encodeDrawioContent(xmlContent) {
    try {
        // Paso 1: URL encode
        const urlEncoded = encodeURIComponent(xmlContent);
        
        // Paso 2: Deflate con pako
        const deflated = pako.deflateRaw(urlEncoded);
        
        // Paso 3: Base64 encode
        let binary = '';
        for (let i = 0; i < deflated.length; i++) {
            binary += String.fromCharCode(deflated[i]);
        }
        return btoa(binary);
    } catch (e) {
        console.error('Error codificando DrawIO:', e);
        return null;
    }
}

// Función para cargar y mostrar archivos DrawIO
async function loadDrawio(xmlContent, fileName) {
    // Intentar crear URL para el visor embebido
    let viewerHtml = '';
    
    try {
        // Comprimir el XML para el visor
        const compressed = encodeDrawioContent(xmlContent);
        
        if (compressed) {
            const viewerUrl = `https://viewer.diagrams.net/?tags=%7B%7D&highlight=0000ff&nav=1&title=${encodeURIComponent(fileName)}&lightbox=1#R${compressed}`;
            
            viewerHtml = `
                <iframe 
                    class="drawio-viewer" 
                    src="${viewerUrl}"
                    frameborder="0"
                    allowfullscreen
                ></iframe>
            `;
        }
    } catch (e) {
        console.error('Error preparando visor DrawIO:', e);
    }
    
    // Si no se pudo crear el visor, mostrar placeholder
    if (!viewerHtml) {
        viewerHtml = `
            <div class="drawio-placeholder">
                <div class="drawio-placeholder-icon">📐</div>
                <h3>Diagrama DrawIO</h3>
                <p>No se pudo cargar el visor del diagrama</p>
            </div>
        `;
    }
    
    elements.docsContent.innerHTML = `
        <div class="drawio-container">
            <div class="drawio-header">
                <span class="drawio-icon">🖼️</span>
                <span class="drawio-title">${fileName}</span>
            </div>
            <div class="drawio-preview">
                ${viewerHtml}
            </div>
        </div>
    `;
    
    elements.docsFileName.textContent = fileName;
    state.currentDoc = { path: fileName, content: xmlContent };
}

// Función para renderizar diagramas Mermaid
async function renderMermaidDiagrams(container) {
    const mermaidBlocks = container.querySelectorAll('pre code.language-mermaid, pre code.mermaid');
    
    for (let i = 0; i < mermaidBlocks.length; i++) {
        const block = mermaidBlocks[i];
        const pre = block.parentElement;
        const code = block.textContent;
        
        try {
            const id = `mermaid-${Date.now()}-${i}`;
            const { svg } = await mermaid.render(id, code);
            
            // Crear contenedor con controles de zoom
            const wrapper = document.createElement('div');
            wrapper.className = 'mermaid-wrapper';
            
            // Controles de zoom
            const controls = document.createElement('div');
            controls.className = 'mermaid-controls';
            controls.innerHTML = `
                <button class="mermaid-zoom-btn" data-action="out" title="Reducir">➖</button>
                <span class="mermaid-zoom-level">100%</span>
                <button class="mermaid-zoom-btn" data-action="in" title="Ampliar">➕</button>
                <button class="mermaid-zoom-btn" data-action="reset" title="Restablecer">🔄</button>
            `;
            
            // Contenedor del diagrama
            const diagramContainer = document.createElement('div');
            diagramContainer.className = 'mermaid-diagram-container';
            
            const diagram = document.createElement('div');
            diagram.className = 'mermaid-diagram';
            diagram.innerHTML = svg;
            diagram.style.transform = 'scale(1)';
            diagram.dataset.zoom = '1';
            
            diagramContainer.appendChild(diagram);
            wrapper.appendChild(controls);
            wrapper.appendChild(diagramContainer);
            
            // Configurar eventos de zoom y arrastre
            setupMermaidZoom(controls, diagram);
            setupMermaidDrag(diagramContainer, diagram);
            
            pre.replaceWith(wrapper);
        } catch (error) {
            console.error('Error rendering mermaid:', error);
            // Mantener el código original si hay error
            block.classList.add('mermaid-error');
        }
    }
}

// Configurar controles de zoom para diagrama Mermaid
function setupMermaidZoom(controls, diagram) {
    const zoomLevelSpan = controls.querySelector('.mermaid-zoom-level');
    const buttons = controls.querySelectorAll('.mermaid-zoom-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            let currentZoom = parseFloat(diagram.dataset.zoom) || 1;
            const action = btn.dataset.action;
            
            if (action === 'in') {
                currentZoom = Math.min(currentZoom + 0.25, 5);
            } else if (action === 'out') {
                currentZoom = Math.max(currentZoom - 0.25, 0.25);
            } else if (action === 'reset') {
                currentZoom = 1;
            }
            
            diagram.dataset.zoom = currentZoom;
            diagram.style.transform = `scale(${currentZoom})`;
            zoomLevelSpan.textContent = `${Math.round(currentZoom * 100)}%`;
        });
    });
}

// Configurar arrastre para diagrama Mermaid
function setupMermaidDrag(container, diagram) {
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;
    
    container.style.cursor = 'grab';
    
    container.addEventListener('mousedown', (e) => {
        // Solo arrastrar con click izquierdo
        if (e.button !== 0) return;
        
        isDragging = true;
        container.style.cursor = 'grabbing';
        startX = e.pageX - container.offsetLeft;
        startY = e.pageY - container.offsetTop;
        scrollLeft = container.scrollLeft;
        scrollTop = container.scrollTop;
        e.preventDefault();
    });
    
    container.addEventListener('mouseleave', () => {
        if (isDragging) {
            isDragging = false;
            container.style.cursor = 'grab';
        }
    });
    
    container.addEventListener('mouseup', () => {
        isDragging = false;
        container.style.cursor = 'grab';
    });
    
    container.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const x = e.pageX - container.offsetLeft;
        const y = e.pageY - container.offsetTop;
        const walkX = (x - startX) * 1.5; // Multiplicador de velocidad
        const walkY = (y - startY) * 1.5;
        
        container.scrollLeft = scrollLeft - walkX;
        container.scrollTop = scrollTop - walkY;
    });
}
