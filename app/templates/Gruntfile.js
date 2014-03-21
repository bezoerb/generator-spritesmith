module.exports = function(grunt) {
    'use strict';

    var path = require('path');

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        sprite: {
            options: {
                // OPTIONAL: Specify algorithm (top-down, left-right, diagonal [\ format],
                // alt-diagonal [/ format], binary-tree [best packing])
                // Visual representations can be found below
                'algorithm': 'top-down',

                // skip function declraration
                cssOpts: {
                    'functions': false
                },

                // OPTIONAL: Specify img options
                'imgOpts': {
                    // Format of the image (inferred from destImg' extension by default) (jpg, png)
                    'format': 'png',

                    // Quality of image (gm only)
                    'quality': 90
                }
            },

            default: {
                'cssFormat': <% if (cssFormat === 'less') { %>'less'<% } else if (cssFormat === 'scss') { %>'scss'<% } else { %>'css'<% } %>,
                // OPTIONAL: Specify padding between images
                'padding': 50,
                // Sprite files to read in
                'src': ['<%= imgDir %>/spritefiles/default/*.{png,jpg,gif}'],

                // Location to output spritesheet
                'destImg': '<%= imgDir %>/sprites/sprite.default.png',
                <% if (cssFormat === 'less') { %>
                'destCSS': '<%= cssDir %>/sprite-variables.default.less',<% } else if (cssFormat === 'scss') { %>
                'destCSS': '<%= cssDir %>/sprite-variables.default.scss',<% } else { %>
                'destCSS': '<%= cssDir %>/sprite.default.css',
                <% } %><% if (cssFormat === 'less') { %>
                'cssTemplate': '<%= cssDir %>/helper/sprite.less.template.mustache',<% } else if (cssFormat === 'scss') { %>
                'cssTemplate': '<%= cssDir %>/helper/sprite.scss.template.mustache',<% } %>

                // OPTIONAL: Manual override for imgPath specified in CSS
                'imgPath': '/<%= imgDir %>/sprites/sprite.default.png',

                // OPTIONAL: Map variable of each sprite
                'cssVarMap': function(sprite) {
                    // `sprite` has `name`, `image` (full path), `x`, `y`
                    //   `width`, `height`, `total_width`, `total_height`
                    // EXAMPLE: Prefix all sprite names with 'sprite-'
                    sprite.name = 'default-' + sprite.name.replace(/\s/, '_');

                }
            },
            2x: {
                'cssFormat': <% if (cssFormat === 'less') { %>'less'<% } else if (cssFormat === 'scss') { %>'scss'<% } else { %>'css'<% } %>,
                // OPTIONAL: Specify padding between images
                'padding': 50,

                // Sprite files to read in
                'src': ['<%= imgDir %>/spritefiles/2x/*.{png,jpg,gif}'],

                // Location to output spritesheet
                'destImg': '<%= imgDir %>/sprites/sprite.retina@2x.png',
                <% if (cssFormat === 'less') { %>
                'destCSS': '<%= cssDir %>/sprite-variables.retina.less',<% } else if (cssFormat === 'scss') { %>
                'destCSS': '<%= cssDir %>/sprite-variables.retina.scss',<% } else { %>
                'destCSS': '<%= cssDir %>/sprite.retina.css',
                <% } %><% if (cssFormat === 'less') { %>
                'cssTemplate': '<%= cssDir %>/helper/retina-sprite.less.template.mustache',<% } else if (cssFormat === 'scss') { %>
                'cssTemplate': '<%= cssDir %>/helper/retina-sprite.scss.template.mustache',<% } %>

                'imgPath': '<%= imgDir %>/sprites/sprite.retina@2x.png',

                // OPTIONAL: Map variable of each sprite
                'cssVarMap': function(sprite) {
                    // `sprite` has `name`, `image` (full path), `x`, `y`
                    //   `width`, `height`, `total_width`, `total_height`
                    // EXAMPLE: Prefix all sprite names with 'sprite-'
                    sprite.name = 'retina-' + sprite.name.replace(/\s/, '_');
                    sprite.width = sprite.width / 2;
                    sprite.height = sprite.height / 2;
                    sprite.total_width = sprite.total_width / 2;
                    sprite.total_height = sprite.total_height / 2;
                    sprite.x = sprite.x / 2;
                    sprite.y = sprite.y / 2;
                    sprite.image2x = sprite.image.replace(/['"\(\)\s]/g, function encodeCssUri(chr) {
                        return '%' + chr.charCodeAt(0).toString(16);
                    });
                    sprite.image = sprite.image.replace(/@2x/, '');

                }
            }
        },
        image_resize: {
            sprite: {
                options: {
                    width: '50%',
                    height: '50%',
                    overwrite: true
                },
                files: [
                    {
                        expand: true,
                        cwd: '<%= imgDir %>/sprites/',
                        src: ['*@2x.png'],
                        dest: '<%= imgDir %>/sprites/',
                        filter: 'isFile',
                        // If specified, this function will be responsible for returning the final
                        // dest filepath. By default, it joins dest and matchedSrcPath like so:
                        rename: function(dest, matchedSrcPath) {
                            return path.join(dest, matchedSrcPath.replace(/@2x\.png/, '.png'));
                        }
                    }
                ]
            }
        },
        // Image min
        imagemin: {
            sprite: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= imgDir %>/sprites/',
                        src: '*.png',
                        dest: '<%= imgDir %>/sprites/'
                    }
                ]
            }

        }
    });

    grunt.loadNpmTasks('grunt-spritesmith');
    grunt.loadNpmTasks('grunt-image-resize');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.registerTask('default', ['sprite', 'image_resize']);


};