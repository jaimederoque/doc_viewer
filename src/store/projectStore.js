const fs = require('fs');
const { PROJECTS_FILE } = require('../config/env');

let projectsData = { items: [] };

function migrateLegacyFormat(parsed) {
    return { items: parsed.map((project) => ({ type: 'project', ...project })) };
}

function loadProjectsFromDisk() {
    try {
        if (!fs.existsSync(PROJECTS_FILE)) {
            projectsData = { items: [] };
            return;
        }

        const rawData = fs.readFileSync(PROJECTS_FILE, 'utf-8');
        if (!rawData) {
            projectsData = { items: [] };
            return;
        }

        const parsed = JSON.parse(rawData);
        if (Array.isArray(parsed)) {
            projectsData = migrateLegacyFormat(parsed);
            saveProjectsToDisk();
            console.log('📦 Migrado projects.json al nuevo formato jerárquico');
        } else if (parsed && Array.isArray(parsed.items)) {
            projectsData = parsed;
        } else {
            projectsData = { items: [] };
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        projectsData = { items: [] };
    }
}

function saveProjectsToDisk() {
    try {
        fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projectsData, null, 2));
    } catch (error) {
        console.error('Error saving projects:', error);
    }
}

function initializeStore() {
    loadProjectsFromDisk();
}

function getProjectsData() {
    return projectsData;
}

function setProjectsItems(items) {
    projectsData.items = items;
    saveProjectsToDisk();
    return projectsData;
}

function pushProject(project) {
    projectsData.items.push(project);
    saveProjectsToDisk();
    return project;
}

function getAllProjects(items = projectsData.items) {
    return items.reduce((acc, item) => {
        if (item.type === 'project') {
            return acc.concat(item);
        }
        if (item.type === 'folder' && Array.isArray(item.items)) {
            return acc.concat(getAllProjects(item.items));
        }
        return acc;
    }, []);
}

function findProjectById(id, items = projectsData.items) {
    for (const item of items) {
        if (item.type === 'project' && item.id === id) {
            return item;
        }
        if (item.type === 'folder' && item.items) {
            const found = findProjectById(id, item.items);
            if (found) return found;
        }
    }
    return null;
}

function findProjectParentFolder(id, items = projectsData.items, parentName = null) {
    for (const item of items) {
        if (item.type === 'project' && item.id === id) {
            return parentName;
        }
        if (item.type === 'folder' && item.items) {
            const found = findProjectParentFolder(id, item.items, item.name);
            if (found !== undefined) return found;
        }
    }
    return undefined;
}

function removeItemById(id, items = projectsData.items) {
    for (let i = 0; i < items.length; i += 1) {
        const current = items[i];
        if (current.id === id) {
            items.splice(i, 1);
            return true;
        }
        if (current.type === 'folder' && current.items) {
            const removed = removeItemById(id, current.items);
            if (removed) return true;
        }
    }
    return false;
}

module.exports = {
    initializeStore,
    getProjectsData,
    setProjectsItems,
    pushProject,
    saveProjectsToDisk,
    getAllProjects,
    findProjectById,
    findProjectParentFolder,
    removeItemById
};
