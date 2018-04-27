const inquirer = require('inquirer');
const portscanner = require('portscanner');
const glob = require('glob');
const path = require('path');
const fuzzy = require('fuzzy');

// 根目录
const projectRoot = path.resolve(__dirname, '../');

// 注册一个inquirer的新类型
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'))

// 获取/src/projects/下的所有的子目录，每个当作是一个可以独立运行的项目
const projects = {};
glob.sync(path.join(projectRoot, 'src/projects/*')).forEach((item) => {
  const projectName = item.split('/').pop();
  projects[projectName] = item;
});

// 用来存放交互问题的数组
const questions = [];

// 端口选择
questions.push({
  type: 'input',
  name: 'port',
  default: 3000,
  message: `请输入调试端口号`,
  validate(input) {
    const port = Number(input);
    return new Promise((resolve, reject) => {
      if (isNaN(port)) {
        reject('端口号必须为数字');
      } else {
        portscanner.checkPortStatus(
          port,
          '127.0.0.1',
          (error, status) => {
            if (error) {
              reject(error);
            } else if (status === 'open') {
              reject(`${port} 端口号已经被占用`);
            } else {
              resolve(true);
            }
          }
        );
      }
    });
  }
});

// 项目选择
questions.push({
  type: 'autocomplete',
  name: 'project',
  message: '请选择需要运行的项目',
  source(answers, input) {
    input = input || '';
    const projectNames = Object.keys(projects);
    return new Promise(function(resolve) {
      setTimeout(function() {
        var fuzzyResult = fuzzy.filter(input, projectNames);
        resolve(fuzzyResult.map(function(el) {
          return el.original;
        }));
      }, 100);
    });
  }
});


inquirer
.prompt(questions)
.then(answer => {
  console.log(answer);
}).catch(console.log);
