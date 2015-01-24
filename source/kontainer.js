var kontainer;

kontainer = (function () {
    'use strict';

    var resolve,
        parse,
        registry = {},
        states = {
            unparsed: 0,
            parsing: -1,
            parsed: 1
        },
        slice = Array.prototype.slice;

    resolve = function (name, path) {
        if (!registry.hasOwnProperty(name)) {
            throw new Error('Unknown dependency "' + name + '".');
        }

        path.push(name);

        var dependency = registry[name];

        if (dependency.state === states.parsing) {
            throw new Error('Cyclic dependency detected while resolving "' + name + '". ' + path.join(' > '));
        }

        if (dependency.state === states.unparsed) {
            dependency.state = states.parsing;
            dependency.value = parse(dependency.factory, path);
            delete dependency.factory;
            dependency.state = states.parsed;
        }

        path.pop();

        return dependency.value;
    };

    parse = function (definition, path, custom) {
        var fn = definition.pop(),
            args = [];

        if (typeof fn !== 'function') {
            throw new Error('The last element in a dependency array must be a function.');
        }

        custom = custom || {};

        args = definition.map(function (key) {
            if (typeof key !== 'string') {
                throw new Error('Each element before a factory function must be a string.');
            }

            return custom.hasOwnProperty(key) ? custom[key] : resolve(key, path);
        });

        return fn.apply(undefined, args);
    };

    function registerFactory(name, factory) {
        if (typeof name !== 'string') {
            throw new Error('The name parameter must be a string.');
        }

        if (!Array.isArray(factory)) {
            throw new Error('Factories must always be arrays.');
        }

        registry[name] = {
            state: states.unparsed,
            factory: slice.call(factory)
        };
    }

    function registerValue(name, value) {
        if (typeof name !== 'string') {
            throw new Error('The name parameter must be a string.');
        }

        registry[name] = {
            state: states.parsed,
            value: value
        };
    }

    function register(name, value) {
        if (Array.isArray(value)) {
            registerFactory(name, value);

            return;
        }

        registerValue(name, value);
    }

    function createViewModel(name, params, componentInfo) {
        return parse(
            this,
            [name],
            {
                params: params,
                componentInfo: componentInfo
            }
        );
    }

    function loadViewModel(componentName, viewModelConfig, callback) {
        if (Array.isArray(viewModelConfig)) {
            callback(createViewModel.bind(viewModelConfig, componentName));

            return;
        }

        callback(null);
    }

    return {
        registerFactory: registerFactory,
        registerValue: registerValue,
        register: register,
        loader: {
            loadViewModel: loadViewModel
        }
    };
}());
