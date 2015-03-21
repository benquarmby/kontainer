# Kontainer
Kontainer is a dependency injection companion for Knockout.js. It allows view models to consume other JavaScript modules and services without being coupled to the global object. A nice side effect is that view models become more naturally testable.

The array based injection pattern (see examples below) takes inspiration from the minification-safe form of DI found in AngularJS. This is the only form supported by Kontainer.

## Example Usage

```JavaScript
// Register the Kontainer component loader with ko.
// This should be done only once during application bootstrapping.
ko.components.loaders.unshift(kontainer.loader);

// Register some singleton values with Kontainer.
kontainer.registerValue('name', 'injected value');

// Register module / service factories with their own dependencies.
kontainer.registerFactory('service', ['name', function (name) {
    var reverseName = name.split('').reverse().join('');

    return {
        reverseName: reverseName
    };
}]);

// Finally register a component with ko.
// As long as the view model is an array, Kontainer will take over resolution.
ko.components.register('some-component', {
    viewModel: ['service', function (service) {
        return {
            name: ko.observable(service.reverseName)
        };
    }],
    template: '<p data-bind="text: name"></p>'
});
```

To consume the `params` and `componentInfo` arguments normally passed to a view model function, inject them as named dependencies in any order:

```JavaScript
ko.components.register('some-component', {
    viewModel: ['componentInfo', 'service', 'params', function (componentInfo, service, params) {
        return {
            // Do something with componentInfo, service and params
        };
    }],
    template: '<p data-bind="text: name"></p>'
});
```

## Caveats

Kontainer could be described as a fully functional experiment. It works exactly as designed, but it's usefulness evaporates if Knockout.js is used with an AMD loader (highly recommended).

Knockout.js already plays [extremely well](http://blog.stevensanderson.com/2014/06/11/architecting-large-single-page-applications-with-knockout-js/) with Require.js, which provides a nice level of decoupling and its own form of dependency injection. Since test-time injection libraries for Require.js already exist - such as [Squire.js](https://github.com/iammerrick/Squire.js/) - adding Kontainer on top would likely just add noise to a project.