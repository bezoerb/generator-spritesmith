'use strict';
var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var fs = require('fs');
var _ = require('lodash');
var log = require('loglevel');
var gruntfile = require('gruntfile-api');


var prompts = [
    {
        type: 'list',
        name: 'cssFormat',
        message: 'Which CSS format do you prefer',
        default: 'css',
        choices: [
            {
                name: 'css',
                value: 'css'
            },
            {
                name: 'less',
                value: 'less'
            },
            {
                name: 'scss',
                value: 'scss'
            }
        ]
    },
    {
        type: 'checkbox',
        name: 'targets',
        message: 'Which targets do you want to include',
        choices: [
            {
                value: 'Default',
                name: 'regular',
                checked: true
            },
            {
                value: 'Retina',
                name: 'retina',
                checked: true
            }
        ]
    }
];


var SpritesmithGenerator = yeoman.generators.Base.extend({


        setDefault: function setDefaults(name, value) {
            var prompt = _.first(_.where(prompts, {name: name}));
            if (prompt) {
                prompt.default = value;
            }
        },

        extendPrompts: function extendPrompts() {
            prompts.push({
                type: 'input',
                name: 'cssDir',
                message: 'Please enter the path of your stylesheets'
            });
            prompts.push({
                type: 'input',
                name: 'imgDir',
                message: 'Please enter the path of your images'
            });
        },

        initDefaults: function initDefaults() {

            var tasks = JSON.parse(gruntfile.getJsonTasks());

            switch (true) {
                case _.has(tasks, 'sass'):
                    this.setDefault('cssFormat', 'scss');
                    break;
                case _.has(tasks, 'compass'):
                    this.setDefault('cssFormat', 'scss');
                    break;
                case _.has(tasks, 'less'):
                    this.setDefault('cssFormat', 'less');
                    break;
            }

//            // try to determine css path
//            var cssDir = _(tasks).filter(function(task, key) {
//                return _.indexOf(['sass', 'compass', 'less', 'cssmin', 'concat'], key) !== -1;
//            }).map(function(task) {
//                log.debug(task);
//                return task;
//            });
        }


    });

module.exports = SpritesmithGenerator.extend({
    init: function() {
        log.setLevel(0);

        this.pkg = yeoman.file.readJSON(path.join(__dirname, '../package.json'));

        // gruntfile already available
        if (fs.statSync(path.join(this.env.cwd, 'Gruntfile.js')).isFile()) {
            this.updateEnv = true;
            gruntfile.init(fs.readFileSync(path.join(this.env.cwd, 'Gruntfile.js'), 'utf-8').toString());
            this.extendPrompts();
            this.initDefaults();
        } else {
            this.updateEnv = false;
        }

        // add packages to package.json


        this.on('end', function() {
            if (!this.options['skip-install']) {
                this.npmInstall();
            }
        });
    },


    askFor: function() {
        var done = this.async();

        // have Yeoman greet the user
        console.log(this.yeoman);

        // replace it with a short and sweet description of your generator
        console.log(chalk.magenta('Add grunt-spritesmith + retina support to an existing project.'));

        this.prompt(prompts, function(props) {
            _.assign(this,props);

            done();
        }.bind(this));
    },

    app: function() {
        this.mkdir('app');
        this.mkdir('app/templates');

        log.debug(this.cssDir);
        log.debug(this.imgDir);

        if (!this.updateEnv) {
            this.copy('_package.json', 'package.json');
            this.template('Gruntfile.js');
        } else {
            var tasks = fs.readdirSync(path.join(this.sourceRoot(), 'tasks/'));
            var self = this;
            tasks.forEach(function (task) {
                var taskbody = self.read('tasks/'+task, 'utf8');
                taskbody = self.engine(taskbody, self);
                log.debug(task,taskbody);


                gruntfile.insertRawConfig(task,taskbody);
            });
            gruntfile.loadNpmTasks('grunt-contrib-watch');
            gruntfile.loadNpmTasks('grunt-spritesmith');
            gruntfile.loadNpmTasks('grunt-image-resize');
            gruntfile.loadNpmTasks('grunt-contrib-imagemin');
            gruntfile.registerTask('spritesmith', ['sprite','image_resize']);
            this.write('Gruntfile.js', gruntfile.toString());
        }
    },

    projectfiles: function() {
        this.copy('editorconfig', '.editorconfig');
        this.copy('jshintrc', '.jshintrc');
    },
});