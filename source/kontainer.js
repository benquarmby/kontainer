/*!
 Kontainer 0.1.0
 Copyright © Ben Quarmby 2015
 https://github.com/benquarmby/kontainer/

 This library may be used under the terms of the Apache License 2.0 (Apache).
 Please see license.txt accompanying this file for more information.
 !*/

(function (factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else {
        window.kontainer = {};
        factory(window.kontainer);
    }
}(function (exports) {
    'use strict';

    var states = {
            injectable: 0,
            injecting: -1,
            resolved: 1
        },
        container,
        mockContainer;

    function validateFactory(factory) {
        if (!(factory instanceof Array)) {
            throw new Error('Factories must always be arrays.');
        }

        var i,
            len = factory.length,
            last = len - 1,
            item;

        for (i = 0; i < len; i += 1) {
            item = factory[i];

            if (i === last) {
                if (typeof item !== 'function') {
                    throw new Error('The last element in a factory array must be a function.');
                }
            } else if (typeof item !== 'string') {
                throw new Error('Each element in a factory array before the function must be a string.');
            }
        }
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
                args = [],
                i,
                len,
                name,
                value;

            for (i = 0, len = factory.length; i < len; i += 1) {
                name = factory[i];
                value = custom && custom.hasOwnProperty(name) ? custom[name] : self.resolve(name, path);

                args.push(value);
            }

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
            if (value instanceof Array) {
                this.registerFactory(name, value);

                return;
            }

            this.registerValue(name, value);
        }
    };

    container = new Container();
    mockContainer = new Container();

    /**
     * Registers a factory with the container.
     * @method
     * @param {String} name The name of the dependency.
     * @param {Array} factory The factory array.
     */
    exports.registerFactory = function (name, factory) {
        container.registerFactory(name, factory);
    };

    /**
     * Registers a value with the container.
     * @method
     * @param {String} name The name of the dependency.
     * @param {Object} value The value.
     */
    exports.registerValue = function (name, value) {
        container.registerValue(name, value);
    };

    /**
     * Registers a dependency with the container.
     * Arrays are assumed to be factories, and all
     * other types are assumed to be values.
     * @method
     * @param {String} name The name of the dependency.
     * @param {Object} value The factory array or value.
     */
    exports.register = function (name, value) {
        container.register(name, value);
    };

    /**
     * The component loader to be registered with Knockout.
     *     ko.components.loaders.unshift(kontainer.loader)
     */
    exports.loader = {
        loadViewModel: function (componentName, viewModelConfig, callback) {
            if (!(viewModelConfig instanceof Array)) {
                callback(null);

                return;
            }

            validateFactory(viewModelConfig);

            callback(function (params, componentInfo) {
                return container.inject(viewModelConfig, [componentName], {
                    params: params,
                    componentInfo: componentInfo
                });
            });
        }
    };

    exports.mock = {
        /**
         * Registers a factory with the mock container.
         * @method
         * @param {String} name The name of the dependency.
         * @param {Array} factory The factory array.
         */
        registerFactory: function (name, factory) {
            mockContainer.registerFactory(name, factory);
        },

        /**
         * Registers a value with the mock container.
         * @method
         * @param {String} name The name of the dependency.
         * @param {Object} value The value.
         */
        registerValue: function (name, value) {
            mockContainer.registerValue(name, value);
        },

        /**
         * Registers a dependency with the mock container.
         * Arrays are assumed to be factories, and all
         * other types are assumed to be values.
         * @method
         * @param {String} name The name of the dependency.
         * @param {Object} value The factory array or value.
         */
        register: function (name, value) {
            mockContainer.register(name, value);
        },

        /**
         * Resolves a factory, injecting it with dependencies
         * from the mock container or specified custom values.
         * @method
         * @param {Array} factory The factory array.
         * @param {Object} custom A dictionary of custom values to inject.
         * @returns {Object} The product of the factory.
         */
        inject: function (factory, custom) {
            validateFactory(factory);

            return mockContainer.inject(factory, [], custom);
        }
    };
}));
