const fs = require('fs');
const path = require('path');
const {
    TREE_FILE_EXTENSIONS,
    CODE_EXTENSIONS,
    IGNORED_DIRECTORIES,
    SPECIAL_FOLDERS
} = require('../config/env');

function buildFileTree(basePath) {
    return readDirectory(basePath, basePath);
}

function readDirectory(basePath, currentPath, relativePath = '') {
    const items = [];
    let entries = [];

    try {
        entries = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch (error) {
        console.error('Error reading directory:', currentPath, error);
        return items;
    }

    entries.forEach((entry) => {
        const fullPath = path.join(currentPath, entry.name);
        const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
            if (IGNORED_DIRECTORIES.includes(entry.name)) {
                return;
            }

            const isSwaggerFolder = entry.name === SPECIAL_FOLDERS.swagger;
            const children = readDirectory(basePath, fullPath, relPath);
            const isDocsFolder = entry.name === SPECIAL_FOLDERS.docs;

            items.push({
                name: entry.name,
                type: 'folder',
                path: relPath,
                isDocsFolder,
                isSwaggerFolder,
                children
            });
            return;
        }

        if (!entry.isFile()) {
            return;
        }

        const ext = path.extname(entry.name).toLowerCase();
        if (!TREE_FILE_EXTENSIONS.includes(ext)) {
            return;
        }

        const item = {
            name: entry.name,
            type: 'file',
            path: relPath,
            fileType: resolveFileType(ext)
        };

        if (CODE_EXTENSIONS.includes(ext)) {
            const docPath = findDocumentation(currentPath, entry.name, ext);
            if (docPath) {
                item.docPath = docPath;
            }
        }

        if (ext === '.md') {
            const sourcePath = findSourceFile(basePath, currentPath, entry.name);
            if (sourcePath) {
                item.sourcePath = sourcePath;
            }
        }

        items.push(item);
    });

    items.sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
    });

    return items;
}

function resolveFileType(ext) {
    if (ext === '.java') return 'java';
    if (ext === '.js') return 'javascript';
    if (ext === '.ts') return 'typescript';
    if (ext === '.yml' || ext === '.yaml') return 'swagger';
    if (ext === '.drawio') return 'drawio';
    return 'markdown';
}

function findDocumentation(currentPath, fileName, extension) {
    const baseName = fileName.replace(extension, '');
    const docsPath = path.join(currentPath, 'docs', `${baseName}.md`);

    if (fs.existsSync(docsPath)) {
        const absoluteParent = path.dirname(currentPath);
        const normalized = path
            .join(absoluteParent, path.basename(currentPath), 'docs', `${baseName}.md`)
            .split(path.sep)
            .join('/');
        return normalized;
    }
    return null;
}

function findSourceFile(basePath, currentPath, mdFileName) {
    if (path.basename(currentPath) !== 'docs') {
        return null;
    }

    const parentPath = path.dirname(currentPath);
    const baseName = mdFileName.replace('.md', '');
    const extensions = CODE_EXTENSIONS;

    for (const ext of extensions) {
        const sourcePath = path.join(parentPath, `${baseName}${ext}`);
        if (fs.existsSync(sourcePath)) {
            return path.relative(basePath, sourcePath).split(path.sep).join('/');
        }
    }
    return null;
}

module.exports = {
    buildFileTree
};
