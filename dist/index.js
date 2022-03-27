#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const inquirer = __importStar(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const shell = __importStar(require("shelljs"));
const CHOICES = fs.readdirSync(path.join(__dirname, 'templates'));
const QUESTIONS = [
    {
        name: 'template',
        type: 'list',
        message: 'What template would you like to use?',
        choices: CHOICES
    },
    {
        name: 'name',
        type: 'input',
        message: 'Please input a new project name:'
    },
    {
        name: 'description',
        type: 'input',
        message: 'Please input the project description:'
    },
    {
        name: 'version',
        type: 'input',
        message: 'Please input the starting version:',
        default: "1.0.0",
    },
    {
        name: 'author',
        type: 'input',
        message: 'Please input the author\'\s name:'
    }
];
const CURR_DIR = process.cwd();
inquirer.prompt(QUESTIONS).then(answers => {
    const projectChoice = answers['template'];
    const projectName = answers['name'];
    const version = answers['version'];
    const author = answers['author'];
    const description = answers['description'];
    const templatePath = path.join(__dirname, 'templates', projectChoice);
    const tartgetPath = path.join(CURR_DIR, projectName);
    const options = {
        projectName,
        templateName: projectChoice,
        templatePath,
        tartgetPath,
        version,
        author,
        description
    };
    if (!createProject(tartgetPath)) {
        return;
    }
    createDirectoryContents(options);
    postProcess(options);
});
function createProject(projectPath) {
    if (fs.existsSync(projectPath)) {
        console.log(chalk_1.default.red(`Folder ${projectPath} exists. Delete or use another name.`));
        return false;
    }
    fs.mkdirSync(projectPath);
    return true;
}
const SKIP_FILES = ['node_modules', '.template.json'];
function createDirectoryContents(options) {
    const filesToCreate = fs.readdirSync(options.templatePath);
    filesToCreate.forEach(file => {
        const origFilePath = path.join(options.templatePath, file);
        const stats = fs.statSync(origFilePath);
        if (SKIP_FILES.indexOf(file) > -1)
            return;
        if (stats.isFile()) {
            let contents = fs.readFileSync(origFilePath, 'utf8');
            let fileName = path.parse(origFilePath).base;
            if (fileName.includes("package.json")) {
                let jsonObject = JSON.parse(contents);
                jsonObject["name"] = options.projectName;
                jsonObject["version"] = options.version;
                jsonObject["author"] = options.author;
                jsonObject["description"] = options.description;
                contents = JSON.stringify(jsonObject, undefined, 2);
            }
            const writePath = path.join(CURR_DIR, options.projectName, file);
            fs.writeFileSync(writePath, contents, 'utf8');
        }
        else if (stats.isDirectory()) {
            fs.mkdirSync(path.join(CURR_DIR, options.projectName, file));
            options.templatePath = path.join(options.templatePath, file);
            options.projectName = path.join(options.projectName, file);
            createDirectoryContents(options);
        }
    });
}
function postProcess(options) {
    const isNode = fs.existsSync(path.join(options.templatePath, 'package.json'));
    if (isNode) {
        shell.cd(options.tartgetPath);
        const result = shell.exec('npm install');
        if (result.code !== 0) {
            return false;
        }
    }
    return true;
}
//# sourceMappingURL=index.js.map