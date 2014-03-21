'use strict';
var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var fs = require('fs');
var _ = require('lodash');
var log = require('loglevel');
var gruntapi = require('gruntfile-api');
var glob = require('glob');
var prettyjson = require('prettyjson');


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
    }
];

/**
 * Helper Methods
 * @type {*|void|Object}
 */
var SpritesmithGenerator = yeoman.generators.Base.extend({

    /**
     * Set default value for prompts
     *
     * @param name
     * @param value
     */
    setDefault: function setDefaults(name, value) {
        var prompt = _.first(_.where(prompts, {name: name}));
        if (prompt) {
            prompt.default = value;
        }
    },

    detectDirectory: function detectDirectory(pattern) {
        var cwd = this.env.cwd;
        return  _(fs.readdirSync(cwd)).filter(function(dir) {
            return !/(node_modules)|(bower_components)/.test(dir);
        }).map(function(dir) {
            return _.map(glob.sync(pattern, {cwd: path.join(cwd, dir)}),function(file){
                return path.join(dir,file);
            });
        }).flatten().reduce(function(dest, file) {
            var dirname = path.dirname(file);
            if (!dest || dirname.split(path.sep) < dest.split(path.sep)) {
                dest = dirname;
            }
            return dest;
        },'');
    },

    /**
     * Add more prompt questions for images and stylesheets
     */
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

    /**
     * Init defaults from existing gruntfile
     */
    initDefaults: function initDefaults() {
        var cssFormatDefault = 'css',
            tasks = JSON.parse(this.gruntfile.getJsonTasks());

        switch (true) {
            case _.has(tasks, 'sass'):
                cssFormatDefault = 'scss';
                break;
            case _.has(tasks, 'compass'):
                cssFormatDefault = 'scss';
                break;
            case _.has(tasks, 'less'):
                cssFormatDefault = 'less';
                break;
        }

        this.setDefault('cssFormat', cssFormatDefault);
        this.setDefault('cssDir', this.detectDirectory('**/*.{css,scss,less}') || 'styles');
        this.setDefault('imgDir', this.detectDirectory('**/*.{png,jpg,gif}') || 'images');
    },


    /**
     * Load NPM Tasks
     * @returns {*}
     */
    loadNpmTasks: function loadNpmTasks() {
        this.gruntfile.loadNpmTasks('grunt-contrib-watch');
        this.gruntfile.loadNpmTasks('grunt-spritesmith');
        this.gruntfile.loadNpmTasks('grunt-image-resize');
        this.gruntfile.loadNpmTasks('grunt-contrib-imagemin');
    },

    /**
     * Add task Configs
     * @returns {*}
     */
    addTasks: function addTasks() {
        var self = this;
        var tasks = fs.readdirSync(path.join(this.sourceRoot(), 'tasks/'));
        tasks.forEach(function(task) {
            var taskbody = self.read('tasks/' + task, 'utf8');
            taskbody = self.engine(taskbody, self);
            self.gruntfile.insertRawConfig(task, taskbody);
        });

        this.gruntfile.registerTask('spritesmith', ['sprite', 'image_resize']);
    },

    /**
     * Merge existing package json with new modules
     *
     * @returns {string} JSON String with merged package contents
     */
    mergePackageJson: function mergePackageJson() {
        var orig = yeoman.file.readJSON(path.join(this.env.cwd, 'package.json')),
            pkg = this.read(path.join(this.sourceRoot(), '_package.json'), 'utf8');

        pkg = _.merge(JSON.parse(this.engine(pkg, this)), orig);
        return JSON.stringify(pkg);
    }




});

module.exports = SpritesmithGenerator.extend({
    init: function() {
        log.setLevel(0);

        this.pkg = yeoman.file.readJSON(path.join(__dirname, '../package.json'));

        // gruntfile already available
        if (fs.statSync(path.join(this.env.cwd, 'Gruntfile.js')).isFile()) {
            this.updateEnv = true;
            this.gruntfile = gruntapi.init(fs.readFileSync(path.join(this.env.cwd, 'Gruntfile.js'), 'utf-8').toString());
            this.extendPrompts();
            this.initDefaults();
        } else {
            this.updateEnv = false;
            this.imgDir = 'images';
            this.cssDir = 'styles';
        }

        // add packages to package.json
        this.mergePackageJson();

        this.on('end', function() {
            if (!this.options['skip-install']) {
              //  this.npmInstall();
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
            _.assign(this, props);

            done();
        }.bind(this));
    },

    app: function() {

        // init fresh installation
        if (!this.updateEnv) {
            this.copy('_package.json', 'package.json');
            this.template('Gruntfile.js');

            // update existing files
        } else {

            // add tasks
            this.loadNpmTasks();
            this.addTasks();

            // use fs.writeFileSync to skip overwrite message
            // this is not needed because of merge
            fs.writeFileSync(path.join(this.env.cwd, 'package.json'), this.mergePackageJson());
            fs.writeFileSync(path.join(this.env.cwd, 'Gruntfile.js'), this.gruntfile.toString());
        }
    },

    stylesheets: function() {
        var helperPath = path.join(this.cssDir, 'spritesmith');
        this.mkdir(helperPath);

        this.copy('helper/sprite.' + this.cssFormat + '.template.mustache', path.join(helperPath, 'sprite.' + this.cssFormat + '.template.mustache'));
        this.copy('helper/retina-sprite.' + this.cssFormat + '.template.mustache', path.join(helperPath, 'retina-sprite.' + this.cssFormat + '.template.mustache'));

        if (this.cssFormat === 'less' || this.cssFormat === 'scss') {
            this.copy('helper/mixins.' + this.cssFormat, path.join(helperPath, 'mixins-spritesmith.' + this.cssFormat));
        }
    },

    projectfiles: function() {
        this.copy('editorconfig', '.editorconfig');
        this.copy('jshintrc', '.jshintrc');
    }
});