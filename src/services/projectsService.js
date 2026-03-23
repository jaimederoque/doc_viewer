const fs = require('fs');
const path = require('path');
const {
    getProjectsData,
    setProjectsItems,
    pushProject,
    saveProjectsToDisk,
    getAllProjects,
    removeItemById
} = require('../store/projectStore');
const { BadRequestError, NotFoundError } = require('../utils/httpErrors');

function getProjects() {
    return getProjectsData();
}

function replaceStructure(items) {
    if (!Array.isArray(items)) {
        throw new BadRequestError('Estructura inválida');
    }
    setProjectsItems(items);
    return getProjectsData();
}

function createFolder(name, parentId) {
    if (!name) {
        throw new BadRequestError('Nombre de carpeta requerido');
    }

    const folder = {
        type: 'folder',
        id: `folder-${Date.now().toString()}`,
        name,
        items: []
    };

    if (parentId) {
        const added = addFolderToParent(getProjectsData().items, parentId, folder);
        if (!added) {
            throw new NotFoundError('Carpeta padre no encontrada');
        }
    } else {
        getProjectsData().items.push(folder);
    }

    saveProjectsToDisk();
    return folder;
}

function renameFolder(id, name) {
    if (!name) {
        throw new BadRequestError('Nombre requerido');
    }

    const renamed = renameFolderRecursive(getProjectsData().items, id, name);
    if (!renamed) {
        throw new NotFoundError('Carpeta no encontrada');
    }

    saveProjectsToDisk();
    return true;
}

function deleteFolder(id) {
    const deleted = deleteFolderRecursive(getProjectsData().items, id);
    if (!deleted) {
        throw new NotFoundError('Carpeta no encontrada');
    }

    saveProjectsToDisk();
    return true;
}

function createProject(name, projectPath) {
    if (!name || !projectPath) {
        throw new BadRequestError('Nombre y ruta son requeridos');
    }

    if (!fs.existsSync(projectPath)) {
        throw new BadRequestError('La ruta especificada no existe');
    }

    const allProjects = getAllProjects();
    const exists = allProjects.some((project) => project.path === projectPath);
    if (exists) {
        throw new BadRequestError('Este proyecto ya está registrado');
    }

    const project = {
        type: 'project',
        id: Date.now().toString(),
        name,
        path: path.normalize(projectPath)
    };

    pushProject(project);
    return project;
}

function deleteProject(id) {
    const removed = removeItemById(id);
    if (!removed) {
        throw new NotFoundError('Proyecto no encontrado');
    }
    saveProjectsToDisk();
    return true;
}

function addFolderToParent(items, parentId, folder) {
    for (const item of items) {
        if (item.id === parentId && item.type === 'folder') {
            item.items.push(folder);
            return true;
        }
        if (item.type === 'folder' && item.items) {
            const added = addFolderToParent(item.items, parentId, folder);
            if (added) return true;
        }
    }
    return false;
}

function renameFolderRecursive(items, folderId, newName) {
    for (const item of items) {
        if (item.id === folderId && item.type === 'folder') {
            item.name = newName;
            return true;
        }
        if (item.type === 'folder' && item.items) {
            const renamed = renameFolderRecursive(item.items, folderId, newName);
            if (renamed) return true;
        }
    }
    return false;
}

function deleteFolderRecursive(items, folderId) {
    for (let i = 0; i < items.length; i += 1) {
        const current = items[i];
        if (current.id === folderId && current.type === 'folder') {
            const folderChildren = current.items || [];
            items.splice(i, 1, ...folderChildren);
            return true;
        }
        if (current.type === 'folder' && current.items) {
            const deleted = deleteFolderRecursive(current.items, folderId);
            if (deleted) return true;
        }
    }
    return false;
}

module.exports = {
    getProjects,
    replaceStructure,
    createFolder,
    renameFolder,
    deleteFolder,
    createProject,
    deleteProject
};
