(function () {
    'use strict';

    var jasminePath = '../node_modules/jasmine-core/lib/jasmine-core';

    require.config({
        paths: {
            jasmine: jasminePath + '/jasmine',
            'jasmine-html': jasminePath + '/jasmine-html',
            'jasmine-boot': jasminePath + '/boot',
            knockout: '../bower_components/knockout/dist/knockout.debug'
        },

        shim: {
            jasmine: {
                exports: 'window.jasmineRequire'
            },
            'jasmine-html': {
                deps: ['jasmine'],
                exports: 'window.jasmineRequire'
            },
            'jasmine-boot': {
                deps: ['jasmine', 'jasmine-html'],
                exports: 'window.jasmineRequire'
            }
        },

        deps: ['jasmine-boot'],

        callback: function () {
            require(['kontainer-spec'], window.onload);
        }
    });
}());
