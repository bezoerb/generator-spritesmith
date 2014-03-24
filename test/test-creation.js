/*global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-generator').test;

describe('spritesmith generator', function() {
    beforeEach(function(done) {
        helpers.testDirectory(path.join(__dirname, 'temp'), function(err) {
            if (err) {
                return done(err);
            }

            this.app = helpers.createGenerator('spritesmith:app', [
                '../../app'
            ]);
            done();
        }.bind(this));
    });

    it('creates expected files for less', function(done) {
        var expected = [
            // add files you expect to exist here.
            '.jshintrc',
            '.editorconfig',
            'Gruntfile.js',
            'package.json',
            'styles/spritesmith/helper/sprite.less.template.mustache',
            'styles/spritesmith/helper/retina-sprite.less.template.mustache',
            'styles/spritesmith/mixins-spritesmith.less',
        ];

        helpers.mockPrompt(this.app, {
            'cssFormat': 'less',
            'cssDir': 'styles',
            'imgDir': 'images'
        });
        this.app.options['skip-install'] = true;
        this.app.run({}, function() {
            helpers.assertFile(expected);
            done();
        });
    });

    it('creates expected files for scss', function(done) {
        var expected = [
            // add files you expect to exist here.
            '.jshintrc',
            '.editorconfig',
            'Gruntfile.js',
            'package.json',
            'styles/spritesmith/helper/sprite.scss.template.mustache',
            'styles/spritesmith/helper/retina-sprite.scss.template.mustache',
            'styles/spritesmith/mixins-spritesmith.scss',
        ];

        helpers.mockPrompt(this.app, {
            'cssFormat': 'scss',
            'cssDir': 'styles',
            'imgDir': 'images'
        });
        this.app.options['skip-install'] = true;
        this.app.run({}, function() {
            helpers.assertFile(expected);
            done();
        });
    });


    it('creates expected files for scss', function(done) {
        var expected = [
            // add files you expect to exist here.
            '.jshintrc',
            '.editorconfig',
            'Gruntfile.js',
            'package.json',
            'styles/spritesmith/helper/sprite.css.template.mustache',
            'styles/spritesmith/helper/retina-sprite.css.template.mustache'
        ];

        helpers.mockPrompt(this.app, {
            'cssFormat': 'css',
            'cssDir': 'styles',
            'imgDir': 'images'
        });
        this.app.options['skip-install'] = true;
        this.app.run({}, function() {
            helpers.assertFile(expected);
            done();
        });
    });
});
