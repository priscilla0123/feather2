var media = feather.project.currentMedia(), isPreview = feather.isPreviewMode, www = feather.project.getTempPath('www');
var statics = feather.config.get('statics'), namespace = feather.config.get('namespace');

if(namespace){
    feather.config.set('output.static', statics + '/' + namespace);
}else{
    feather.config.set('output.static', statics);
}

switch(media){
    case 'test':
        feather.match('**.js', {
            optimizer: feather.plugin('uglify-js', {
                sourceMap: true
            })
        });

    case 'pd':
    case 'production':
        feather.match('**', {
            useHash: true
        });

        feather.match('**.js', {
            optimizer: feather.plugin('uglify-js')
        });

        feather.match('**.{less,css}', {
            optimizer: feather.plugin('clean-css')
        });

        feather.match('**.${template.suffix}', {
            optimizer: feather.plugin('htmlmin')
        });

        feather.match('**.png', {
            optimizer: feather.plugin('png-compressor')
        });

        feather.match('::package', {
            spriter: feather.plugin('csssprites')
        });

        break;

    default:;
}

feather.match('**.js', {
    preprocessor: feather.config.get('preprocessor'),
    postprocessor: feather.config.get('postprocessor')
});

feather.match('widget/(**)', {
    url: '${output.static}/w_/$1',
    release: 'static/${output.static}/w_/$1',
    isWidget: true
});

feather.match('pagelet/(**)', {
    url: '${output.static}/pl_/$1',
    release: 'static/${output.static}/pl_/$1',
    isPagelet: true
});

//feather2.0支持test目录，作为测试目录， 同page目录，只是release时，如果不是预览模式，则不会产出，用于日常的单元测试
//此目录下所有静态资源都会被临时产出到static/t_下面
feather.match('test/(**)', {
    url: '${output.static}/t_/$1',
    release: isPreview ? 'static/${output.static}/t_/$1' : false
}, isPreview ? null : 10);

feather.match('/(**.${template.suffix})', {
    release: 'view/${namespace}/$&',
    isHtmlLike: true,
    useHash: false,
    useMap: true,
    url: false,
    preprocessor: feather.config.get('preprocessor'),
    postprocessor: feather.config.get('postprocessor')
});

feather.match('components/(**)', {
    url: '${output.static}/c_/$1',
    release: 'static/${output.static}/c_/$1',
    isComponent: true,
    isHtmlLike: false
}, 10);

feather.match('components/**.js', {
    useSameNameRequire: true
});

feather.match('**.{less,css}', {
    parser: feather.plugin('less'),
    rExt: '.css',
    useSprite: true
});

feather.match('static/(**)', {
    isHtmlLike: false,
    url: '${output.static}/$1',
    release: 'static/${output.static}/$1'
});

//任意目录下的third都不做任何处理
feather.match(/^\/static\/(?:.+?\/)*third\/.*$/, {
    useParser: false,
    useCompile: false,
    useHash: false,
    isThird: true
}, 100000);

//只针对third目录下的同文件夹名的主文件做编译处理
feather.match(/^\/static\/(?:.+?\/)*third\/([^\/]+)\/\1\.[^\.]+$/, {
    useParser: true,
    useCompile: true,
    useHash: true,
    isThird: true
}, 100001);

//feather2.0规定data目录 同feather1.x中的test目录，1.x中test目录创建的初衷也是为了测试数据
feather.match('/data/**', {
    useHash: false,
    useCompile: false,
    release: isPreview ? '$&' : false
});

feather.match('**/pack.json', {
    useCompile: false,
    useParser: false,
    release: false
});

feather.match('/conf/**', {
    useCompile: false,
    useParser: false,
    release: isPreview ? '$&' : false
});

feather.match('**/{component,bower}.json', {
    useCompile: false,
    useParser: false,
    release: false
});

feather.match('**', {
    deploy: feather.plugin('default')
});

feather.match('::package', {
    prepackager: feather.config.get('prepackager'),
    packager: feather.config.get('packager'),
    postpackager: feather.config.get('postpackager')
});

if(!feather.config.get('deploy.preview')){
    feather.config.set('deploy.preview', [ 
        {
            from: '/static',
            to: www + '/static',
            subOnly: true
        },
        {
            from: '/view',
            to: www,
            subOnly: true
        },
        {
            from: '/conf',
            to: www
        }
    ]);
}