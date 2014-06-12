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
var editorconfig = require('editorconfig');


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
        type: 'input',
        name: 'cssDir',
        message: 'Please enter the base path of your stylesheets',
        default: 'styles'
    },
    {
        type: 'input',
        name: 'imgDir',
        message: 'Please enter the base path of your images',
        default: 'images'
    },
    {
        type: 'input',
        name: 'cssImgDir',
        message: 'Please enter the base path of your images specified in CSS',
        default: '../images'
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
            return !/(\.tmp)|(node_modules)|(bower_components)/.test(dir);
        }).map(function(dir) {
            return _.map(glob.sync(pattern, {cwd: path.join(cwd, dir)}), function(file) {
                return path.join(dir, file);
            });
        }).flatten().reduce(function(dest, file) {
            var dirname = path.dirname(file);
            if (!dest || dirname.split(path.sep).length < dest.split(path.sep).length) {
                dest = dirname;
            }
            return dest;
        }, '');
    },

    /**
     * Init defaults from existing gruntfile
     */
    initDefaults: function initDefaults() {
        var cssFormatDefault = 'css',
            tasks = this.gruntfile ? JSON.parse(this.gruntfile.getJsonTasks()) : {};

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
        this.setDefault('cssDir', this.detectDirectory('**/*.{scss,css,less}') || 'styles');
        this.setDefault('imgDir', this.detectDirectory('**/*.{png,jpg,gif}') || 'images');
        this.setDefault('cssImgDir', function(answers) {
            var result = '../' + answers.imgDir || '';

            // try to strip common paths from img and css path
            for (var i in answers.cssDir) {
                if (answers.imgDir.length > i && answers.cssDir[i] !== answers.imgDir[i]) {
                    return '../' + answers.imgDir.substr(i);
                }
            }

            return result;
        });
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

        // add required global
        try {
            this.gruntfile.addGlobalDeclarationRaw('path', 'require(\'path\')');
        } catch (err) {

        }

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
            pkg = this.read(path.join(this.sourceRoot(), '_package.json'), 'utf8'),
            conf = editorconfig.parse(path.join(this.env.cwd, 'package.json')) || {indent_size: 4};

        pkg = _.merge(JSON.parse(this.engine(pkg, this)), orig);
        return JSON.stringify(pkg, null, conf.indent_size);
    }




});

module.exports = SpritesmithGenerator.extend({
    init: function() {
        log.setLevel(0);

        this.pkg = yeoman.file.readJSON(path.join(__dirname, '../package.json'));

        // gruntfile already available
        var gruntfilePath = path.join(this.env.cwd, 'Gruntfile.js');
        var conf = editorconfig.parse(gruntfilePath) || {indent_size: 4, indent_style: 'space'};

        // add esformatter indent option based on .editorconfig
        this.formatoptions = {
            'indent': {
                'value': _.times(conf.indent_size,function() {
                    return (conf.indent_style === 'space') ? ' ' : '\t';
                }).join('')
            }
        };


        if (fs.existsSync(gruntfilePath)) {
            this.updateEnv = true;
            this.gruntfile = gruntapi.init(fs.readFileSync(gruntfilePath, 'utf-8').toString());
        } else {
            this.updateEnv = false;
        }

        this.initDefaults();


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
        console.log(chalk.magenta('Add grunt-spritesmith + retina support to your project.'));
        console.log(chalk.magenta('Existing Gruntfile and package.json files will be backuped and modified.'));

        this.prompt(prompts, function(props) {
            _.assign(this, props);
            done();
        }.bind(this));
    },

    app: function() {

        // add package json
        if (fs.existsSync(path.join(this.env.cwd, 'package.json'))) {
            var pkg = this.mergePackageJson();

            // backup existing one
            if (!fs.existsSync(path.join(this.env.cwd, 'package.json.backup')) && fs.existsSync(path.join(this.env.cwd, 'package.json'))) {
                fs.renameSync(path.join(this.env.cwd, 'package.json'), path.join(this.env.cwd, 'package.json.backup'));
            }

            fs.writeFileSync(path.join(this.env.cwd, 'package.json'), pkg);
        } else {
            this.copy('_package.json', 'package.json');
        }

        // init fresh installation
        if (!this.updateEnv) {
            this.template('Gruntfile.js');

            // update existing files
        } else {
            // backup old gruntfile
            if (!fs.existsSync(path.join(this.env.cwd, 'Gruntfile.js.backup')) && fs.existsSync(path.join(this.env.cwd, 'Gruntfile.js'))) {
                fs.renameSync(path.join(this.env.cwd, 'Gruntfile.js'), path.join(this.env.cwd, 'Gruntfile.js.backup'));
            }

            // use fs.writeFileSync to skip overwrite message
            // this is not needed because of merge
            this.loadNpmTasks();
            this.addTasks();
            fs.writeFileSync(path.join(this.env.cwd, 'Gruntfile.js'), this.gruntfile.toString(this.formatoptions));
        }
    },

    stylesheets: function() {
        var helperPath = path.join(this.cssDir, 'spritesmith');
        this.mkdir(helperPath);

        this.copy('helper/sprite.' + this.cssFormat + '.template.mustache', path.join(helperPath, 'helper', 'sprite.' + this.cssFormat + '.template.mustache'));
        this.copy('helper/retina-sprite.' + this.cssFormat + '.template.mustache', path.join(helperPath, 'helper', 'retina-sprite.' + this.cssFormat + '.template.mustache'));

        if (this.cssFormat === 'less' || this.cssFormat === 'scss') {
            this.copy('helper/mixins.' + this.cssFormat, path.join(helperPath, 'mixins-spritesmith.' + this.cssFormat));
        }
    },

    projectfiles: function() {
        if (!fs.existsSync(path.join(this.env.cwd, '.editorconfig'))) {
            this.copy('editorconfig', '.editorconfig');
        }
        if (!fs.existsSync(path.join(this.env.cwd, '.jshintrc'))) {
            this.copy('jshintrc', '.jshintrc');
        }
    },

    dummyImages: function() {
        this.copy('img/bower.png', path.join(this.imgDir, 'spritefiles', 'default', 'bower.png'));
        this.copy('img/bower.png', path.join(this.imgDir, 'spritefiles', '2x', 'bower.png'));

        this.copy('img/grunt.png', path.join(this.imgDir, 'spritefiles', 'default', 'grunt.png'));
        this.copy('img/grunt.png', path.join(this.imgDir, 'spritefiles', '2x', 'grunt.png'));

        this.copy('img/yeoman.png', path.join(this.imgDir, 'spritefiles', 'default', 'yeoman.png'));
        this.copy('img/yeoman.png', path.join(this.imgDir, 'spritefiles', '2x', 'yeoman.png'));
    }
});