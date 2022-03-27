#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as inquirer from 'inquirer';
import chalk from 'chalk';
import * as shell from 'shelljs';

const CHOICES = fs.readdirSync(path.join(__dirname, 'templates'));
const QUESTIONS: inquirer.QuestionCollection = [
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
    }];

export interface CliOptions {
    projectName: string
    templateName: string
    templatePath: string
    tartgetPath: string
    version: string
    author: string,
    description: string
}

const CURR_DIR = process.cwd();

inquirer.prompt(QUESTIONS).then(answers => {

    const projectChoice = answers['template'];
    const projectName = answers['name'];
    const version = answers['version'];
    const author = answers['author'];
    const description = answers['description'];
    const templatePath = path.join(__dirname, 'templates', projectChoice);
    const tartgetPath = path.join(CURR_DIR, projectName);

    const options: CliOptions = {
        projectName,
        templateName: projectChoice,
        templatePath,
        tartgetPath,
        version,
        author,
        description
    }

    if (!createProject(tartgetPath)) {
        return;
    }

    createDirectoryContents(options);

    postProcess(options);
});

function createProject(projectPath: string) {

    if (fs.existsSync(projectPath)) {
        console.log(chalk.red(`Folder ${projectPath} exists. Delete or use another name.`));
        return false;
    }
    fs.mkdirSync(projectPath);

    return true;
}

const SKIP_FILES = ['node_modules', '.template.json'];

function createDirectoryContents(options: CliOptions) {

    const filesToCreate = fs.readdirSync(options.templatePath);

    filesToCreate.forEach(file => {

        const origFilePath = path.join(options.templatePath, file);
        const stats = fs.statSync(origFilePath);

        if (SKIP_FILES.indexOf(file) > -1) return;

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
        } else if (stats.isDirectory()) {
            fs.mkdirSync(path.join(CURR_DIR, options.projectName, file));

            options.templatePath = path.join(options.templatePath, file);
            options.projectName = path.join(options.projectName, file);
            createDirectoryContents(options);
        }
    });
}

function postProcess(options: CliOptions) {
    
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