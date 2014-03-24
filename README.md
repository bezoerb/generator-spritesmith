# generator-spritesmith [![Build Status](https://secure.travis-ci.org/bezoerb/generator-spritesmith.png?branch=master)](https://travis-ci.org/bezoerb/generator-spritesmith)

> [Yeoman](http://yeoman.io) generator to add grunt-spritesmith + retina support to an existing project

## Getting Started

### What is Yeoman?

Trick question. It's not a thing. It's this guy:

![](http://i.imgur.com/JHaAlBJ.png)

Basically, he wears a top hat, lives in your computer, and waits for you to tell him what kind of application you wish to create.

Not every new computer comes with a Yeoman pre-installed. He lives in the [npm](https://npmjs.org) package repository. You only have to ask for him once, then he packs up and moves into your hard drive. *Make sure you clean up, he likes new and shiny things.*

```
$ npm install -g yo
```

### Yeoman Generators

Yeoman travels light. He didn't pack any generators when he moved in. You can think of a generator like a plug-in. You get to choose what type of application you wish to create, such as a Backbone application or even a Chrome extension.

To install generator-spritesmith from npm, run:

```
$ npm install -g generator-spritesmith
```

Finally, initiate the generator:

```
$ yo spritesmith
```

### What do you get?

After running `yo spritesmith` all required npm modules are installed and the task configurations will be added to your existing Gruntfile. This is done via AST manipulation so it does not break your existing configuration. 
When there is no Gruntfile inside your project this generator will add a new one.

## License

MIT
