/*!
 Kontainer 0.1.0
 Copyright © Ben Quarmby 2015
 https://github.com/benquarmby/kontainer/

 This library may be used under the terms of the Apache License 2.0 (Apache).
 Please see license.txt accompanying this file for more information.
 !*/

var kontainer;

kontainer = (function () {
    'use strict';

    var states = {
            injectable: 0,
            injecting: -1,
            resolved: 1
        },
        container,
        mockContainer;

    function validateFactory(factory) {
        if (!Array.isArray(factory)) {
            throw new Error('Factories must always be arrays.');
        }

        var last = factory.length - 1;

        factory.forEach(function (item, index) {
            if (index === last) {
                if (typeof item !== 'function') {
                    throw new Error('The last element in a factory array must be a function.');
                }

                return;
            }

            if (typeof item !== 'string') {
                throw new Error('Each element in a factory array before the function must be a string.');
            }
        });
    }

    function Container() {
        this.registry = {};
    }

    Container.prototype = {
        constructor: Container,

        resolve: function (name, path) {
            if (!this.registry.hasOwnProperty(name)) {
                throw new Error('Unknown dependency "' + name + '".');
            }

            path.push(name);

            var dependency = this.registry[name];

            if (dependency.state === states.injecting) {
                throw new Error('Cyclic dependency detected while resolving "' + name + '". ' + path.join(' > '));
            }

            if (dependency.state === states.injectable) {
                dependency.state = states.injecting;
                dependency.value = this.inject(dependency.factory, path);
                delete dependency.factory;
                dependency.state = states.resolved;
            }

            path.pop();

            return dependency.value;
        },

        inject: function (factory, path, custom) {
            var self = this,
                fn = factory.pop(),
                args;

            args = factory.map(function (key) {
                return custom && custom.hasOwnProperty(key) ? custom[key] : self.resolve(key, path);
            });

            return fn.apply(undefined, args);
        },

        registerFactory: function (name, factory) {
            if (typeof name !== 'string') {
                throw new Error('The name parameter must be a string.');
            }

            validateFactory(factory);

            this.registry[name] = {
                state: states.injectable,
                factory: factory.slice()
            };
        },

        registerValue: function (name, value) {
            if (typeof name !== 'string') {
                throw new Error('The name parameter must be a string.');
            }

            this.registry[name] = {
                state: states.resolved,
                value: value
            };
        },

        register: function (name, value) {
            if (Array.isArray(value)) {
                this.registerFactory(name, value);

                return;
            }

            this.registerValue(name, value);
        }
    };

    container = new Container();

    function createViewModel(factory, name, params, componentInfo) {
        return container.inject(factory, [name], {
            params: params,
            componentInfo: componentInfo
        });
    }

    function loadViewModel(componentName, viewModelConfig, callback) {
        if (Array.isArray(viewModelConfig)) {
            validateFactory(viewModelConfig);
            callback(createViewModel.bind(null, viewModelConfig, componentName));

            return;
        }

        callback(null);
    }

    mockContainer = new Container();

    function mockInject(factory, custom) {
        validateFactory(factory);

        return mockContainer.inject(factory, [], custom);
    }

    return {
        /**
         * Registers a factory with the container.
         * @method
         * @param {String} name The name of the dependency.
         * @param {Array} factory The factory array.
         */
        registerFactory: container.registerFactory.bind(container),

        /**
         * Registers a value with the container.
         * @method
         * @param {String} name The name of the dependency.
         * @param {Object} value The value.
         */
        registerValue: container.registerValue.bind(container),

        /**
         * Registers a dependency with the container.
         * Arrays are assumed to be factories, and all
         * other types are assumed to be values.
         * @method
         * @param {String} name The name of the dependency.
         * @param {Object} value The factory array or value.
         */
        register: container.register.bind(container),

        /**
         * The component loader to be registered with Knockout.
         *     ko.components.loaders.unshift(kontainer.loader)
         */
        loader: {
            loadViewModel: loadViewModel
        },

        mock: {
            /**
             * Registers a factory with the mock container.
             * @method
             * @param {String} name The name of the dependency.
             * @param {Array} factory The factory array.
             */
            registerFactory: mockContainer.registerFactory.bind(mockContainer),

            /**
             * Registers a value with the mock container.
             * @method
             * @param {String} name The name of the dependency.
             * @param {Object} value The value.
             */
            registerValue: mockContainer.registerValue.bind(mockContainer),

            /**
             * Registers a dependency with the mock container.
             * Arrays are assumed to be factories, and all
             * other types are assumed to be values.
             * @method
             * @param {String} name The name of the dependency.
             * @param {Object} value The factory array or value.
             */
            register: mockContainer.register.bind(mockContainer),

            /**
             * Resolves a factory, injecting it with dependencies
             * from the mock container.
             * @method
             * @param {Array} factory The factory array.
             * @returns {Object} The product of the factory.
             */
            inject: mockInject
        }
    };
}());
