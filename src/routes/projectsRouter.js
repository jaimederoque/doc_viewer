const express = require('express');
const upload = require('../middleware/upload');
const {
    getProjects,
    replaceStructure,
    createFolder,
    renameFolder,
    deleteFolder,
    createProject,
    deleteProject
} = require('../services/projectsService');
const {
    getProjectTree,
    getFileContent,
    getDocumentation,
    getRawFile,
    deleteFileOrFolder,
    uploadFiles,
    saveMarkdownFile
} = require('../services/fileService');
const { searchInProject } = require('../services/searchService');
const { findProjectById } = require('../store/projectStore');
const { NotFoundError } = require('../utils/httpErrors');
const { MAX_UPLOAD_FILES } = require('../config/env');

const router = express.Router();

const asyncHandler = (handler) => async (req, res, next) => {
    try {
        await handler(req, res, next);
    } catch (error) {
        next(error);
    }
};

function ensureProject(id) {
    const project = findProjectById(id);
    if (!project) {
        throw new NotFoundError('Proyecto no encontrado');
    }
    return project;
}

router.get('/', (req, res) => {
    res.json(getProjects());
});

router.put('/', asyncHandler((req, res) => {
    const { items } = req.body;
    const data = replaceStructure(items);
    res.json(data);
}));

router.post('/', asyncHandler((req, res) => {
    const { name, path: projectPath } = req.body;
    const project = createProject(name, projectPath);
    res.json(project);
}));

router.post('/folder', asyncHandler((req, res) => {
    const { name, parentId } = req.body;
    const folder = createFolder(name, parentId);
    res.json(folder);
}));

router.patch('/folder/:id', asyncHandler((req, res) => {
    const { name } = req.body;
    renameFolder(req.params.id, name);
    res.json({ success: true });
}));

router.delete('/folder/:id', asyncHandler((req, res) => {
    deleteFolder(req.params.id);
    res.json({ success: true });
}));

router.delete('/:id', asyncHandler((req, res) => {
    deleteProject(req.params.id);
    res.json({ success: true });
}));

router.get('/:id/tree', asyncHandler((req, res) => {
    const project = ensureProject(req.params.id);
    const tree = getProjectTree(project.path);
    res.json(tree);
}));

router.get('/:id/file', asyncHandler((req, res) => {
    const project = ensureProject(req.params.id);
    const file = getFileContent(project.path, req.query.path);
    res.json(file);
}));

router.get('/:id/raw', asyncHandler((req, res) => {
    const project = ensureProject(req.params.id);
    const file = getRawFile(project.path, req.query.path);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(file.fullPath);
}));

router.get('/:id/doc', asyncHandler((req, res) => {
    const project = ensureProject(req.params.id);
    const sourcePath = req.query.sourcePath || req.query.javaPath;
    const doc = getDocumentation(project.path, sourcePath);
    res.json(doc);
}));

router.get('/:id/search', asyncHandler((req, res) => {
    const project = ensureProject(req.params.id);
    const { q } = req.query;
    if (!q || !q.trim()) {
        res.status(400).json({ error: 'Texto de búsqueda requerido' });
        return;
    }
    const result = searchInProject(project.path, q);
    res.json(result);
}));

router.post('/:id/upload', upload.array('files', MAX_UPLOAD_FILES), asyncHandler((req, res) => {
    const project = ensureProject(req.params.id);
    const { folderPath } = req.body;
    const result = uploadFiles(project.path, folderPath, req.files);
    res.json(result);
}));

router.put('/:id/file', asyncHandler((req, res) => {
    const project = ensureProject(req.params.id);
    const { filePath, content } = req.body;
    const result = saveMarkdownFile(project.path, filePath, content);
    res.json(result);
}));

router.delete('/:id/file', asyncHandler((req, res) => {
    const project = ensureProject(req.params.id);
    const { filePath } = req.body;
    const result = deleteFileOrFolder(project.path, filePath);
    res.json(result);
}));

module.exports = router;
