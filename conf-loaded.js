'use strict';

feather.on('conf:loaded', function(){
	var modulename = feather.config.get('project.modulename'), ns = feather.config.get('project.name');
    var isCommon = !modulename || modulename == 'common';

    if(!ns){
        feather.config.set('project.name', ns = '_default');
    }

    //查找是否有common模块
    if(isCommon){
    	feather.commonInfo = {
            config: {},
            components: {},
            map: {}
        };
    }else{
        var root = feather.project.getCachePath() + '/info/' + ns + '.json';

        if(feather.util.exists(root)){
            var info = feather.util.read(root);
            try{
                feather.commonInfo = (new Function('return ' + info))();
            }catch(e){
                feather.log.on.error('common info is not valid jsondata! rerun common module please!');
                feather.log.error('common info is not valid jsondata! rerun common module please!');
            }
        }else{
        	feather.log.on.error('Run common module first please!');
            feather.log.error('Run common module first please!');
        }

        var commonConfig = feather.commonInfo.config, config = feather.config.get();

        feather.config.set('require', commonConfig.require);
        feather.config.set('template.suffix', commonConfig.template.suffix);
        feather.config.set('widget', commonConfig.widget);
        feather.config.set('cssA2R', commonConfig.cssA2R);
        feather.config.set('comboDebug', commonConfig.comboDebug);
        feather.config.set('project.mode', commonConfig.project.mode);

        if(feather.util.isEmpty(config.project.domain)){
            feather.config.set('project.domain', commonConfig.project.domain);
        }

        if(commonConfig.statics != config.statics){
            feather.log.warn('common module\'s statics[' + commonConfig.statics + '] is different from current module\'s statics[' + config.statics + ']!');
        }
    }
})

//load all pack.json
feather.on('conf:loaded', function(){
    var files = feather.project.getSourceByPatterns('**/pack.json');
    var path = require('path');
    var previousPack = feather.config.get('pack') || {}, pack = {};

    Object.keys(files).reverse().forEach(function(subpath){
        var file = files[subpath];
        var dir = path.dirname(file.id) + '/';
        var json;

        try{
            json = JSON.parse(file.getContent());
        }catch(e){
            feather.log.warn('unable to load file [`%s`].', file.id);
        }

        if(json){
            for(var i in json){
                var list = json[i];

                if(i[0] == '.'){
                    i = path.normalize(dir + i).replace(/[\\\/]+/g, '/');
                }

                if(list.constructor != Array){
                    list = [list];
                }

                list = list.map(function(item){
                    if(typeof item == 'string' && item[0] == '.'){
                        return path.normalize(dir + item).replace(/[\\\/]+/g, '/');
                    }

                    return item;
                });

                pack[i] = list;
            }
        }
    });

    for(var i in pack){
        previousPack[i] = pack[i];
    }
    
    feather.config.set('pack', previousPack);
});

feather.on('conf:loaded', function(){
    var files = feather.project.getSourceByPatterns('/conf/deploy/*.js');
    var deploys = feather.config.get('deploy') || {}, root = feather.project.getProjectPath();

    feather.util.map(files, function(subpath, file){
        if(deploys[file.filename]) return;

        var exports = require(file.realpath);
        var config = [];

        if(!Array.isArray(exports)){
            exports = [exports];
        }

        exports.forEach(function(item){
            if(!item.to) return;

            if(item.to[0] == '.'){
                item.to = require('path').normalize(root + '/' + item.to).replace(/[\\\/]+/g, '/');
            }

            config.push(item);
        });

        if(config.length){
            deploys[file.filename] = config;
        }        
    });

    feather.config.set('deploy', deploys);
});

//load config.js
feather.on('conf:loaded', function(){
    feather.config.set('project.mode', 'php');

    switch(feather.config.get('project.mode')){
        case 'php':
            require('./config/php.js');
            break;

        default:
            require('./config/static.js');
    }
});

feather.on('conf:loaded', function(){
    feather._argv.dest == 'preview' && require('feather2-command-switch').switch(feather.config.get('project.name'), true);
});