const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DATA_PATH = process.env.DATA_PATH || ROOT_DIR;
const PROJECTS_FILE = path.join(DATA_PATH, 'projects.json');
const PORT = Number(process.env.PORT) || 80;

const UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_UPLOAD_FILES = 20;

const TREE_FILE_EXTENSIONS = ['.java', '.js', '.ts', '.md', '.yml', '.yaml', '.drawio'];
const CODE_EXTENSIONS = ['.java', '.js', '.ts'];
const SEARCHABLE_EXTENSIONS = ['.java', '.js', '.ts', '.md', '.yml', '.yaml', '.drawio'];
const IGNORED_DIRECTORIES = ['node_modules', '.git', 'target', '.idea', 'build', 'docs'];
const SPECIAL_FOLDERS = {
    swagger: 'swagger',
    docs: 'docs'
};

module.exports = {
    ROOT_DIR,
    DATA_PATH,
    PROJECTS_FILE,
    PORT,
    UPLOAD_LIMIT_BYTES,
    MAX_UPLOAD_FILES,
    TREE_FILE_EXTENSIONS,
    CODE_EXTENSIONS,
    SEARCHABLE_EXTENSIONS,
    IGNORED_DIRECTORIES,
    SPECIAL_FOLDERS
};
