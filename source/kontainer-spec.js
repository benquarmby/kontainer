describe('kontainer', function () {
    'use strict';

    describe('registerFactory', function () {
        it('should throw given non string name', function () {
            expect(function () {
                kontainer.registerFactory(true);
            }).toThrowError(/name/i);
        });

        it('should throw given non array factory', function () {
            expect(function () {
                kontainer.registerFactory('name', {});
            }).toThrowError(/array/i);
        });

        it('should accept array factory', function () {
            kontainer.registerFactory('name', []);
        });
    });

    describe('registerValue', function () {
        it('should throw given non string name', function () {
            expect(function () {
                kontainer.registerValue(true);
            }).toThrowError(/name/i);
        });

        it('should accept object value', function () {
            kontainer.registerValue('name', {});
        });

        it('should accept primitive value', function () {
            kontainer.registerValue('name', 'value');
        });
    });

    describe('register', function () {
        it('should throw given non string name', function () {
            expect(function () {
                kontainer.register(false);
            }).toThrowError(/name/i);
        });

        it('should accept any value', function () {
            kontainer.register('name', /regexp/);
            kontainer.register('name', []);
            kontainer.register('name', 12345);
        });
    });

    describe('loader', function () {
        var element;

        ko.components.loaders.unshift(kontainer.loader);

        function registerComponent(factory) {
            ko.components.register('fake-component', {
                viewModel: factory,
                template: '<p data-bind="text: name"></p>'
            });
        }

        beforeEach(function () {
            jasmine.clock().install();
            element = document.createElement('div');
            element.setAttribute('data-bind', 'component: \'fake-component\'');
            document.body.appendChild(element);
        });

        afterEach(function () {
            jasmine.clock().uninstall();
            ko.components.unregister('fake-component');
            document.body.removeChild(element);
            element = null;
        });

        it('should inject value into template', function () {
            kontainer.registerValue('name', 'injected value');

            registerComponent(['name', function (name) {
                return {
                    name: ko.observable(name)
                };
            }]);

            ko.applyBindings(null, element);
            jasmine.clock().tick(1);
            expect(element.firstChild.innerHTML).toBe('injected value');
        });

        it('should only invoke factories once', function () {
            var factory1 = jasmine.createSpy(),
                factory2 = jasmine.createSpy();

            kontainer.register('service1', [factory1]);
            kontainer.register('service2', ['service1', factory2]);

            registerComponent(['service2', 'service1', function () {
                return {
                    name: ko.observable()
                };
            }]);

            ko.applyBindings(null, element);
            jasmine.clock().tick(1);
            expect(factory1.calls.count()).toBe(1);
            expect(factory2.calls.count()).toBe(1);
        });

        it('should inject value from service into template', function () {
            kontainer.register('name', 'injected value');
            kontainer.register('service', ['name', function (name) {
                var reverseName = name.split('').reverse().join('');

                return {
                    reverseName: reverseName
                };
            }]);

            registerComponent(['service', function (service) {
                return {
                    name: ko.observable(service.reverseName)
                };
            }]);

            ko.applyBindings(null, element);
            jasmine.clock().tick(1);
            expect(element.firstChild.innerHTML).toBe('eulav detcejni');
        });

        it('should throw given cyclic dependency', function () {
            kontainer.registerFactory('service1', ['service2', function () {
                return {};
            }]);
            kontainer.registerFactory('service2', ['service1', function () {
                return {};
            }]);

            registerComponent(['service1', function (service) {
                return {
                    name: ko.observable(service.reverseName)
                };
            }]);

            ko.applyBindings(null, element);

            expect(function () {
                jasmine.clock().tick(1);
            }).toThrowError(/fake-component > service1 > service2 > service1/i);
        });
    });
});
