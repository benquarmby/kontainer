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
            expect(function () {
                kontainer.registerFactory('name', []);
            }).not.toThrow();
        });
    });

    describe('registerValue', function () {
        it('should throw given non string name', function () {
            expect(function () {
                kontainer.registerValue(true);
            }).toThrowError(/name/i);
        });

        it('should accept object value', function () {
            expect(function () {
                kontainer.registerValue('name', {});
            }).not.toThrow();
        });

        it('should accept primitive value', function () {
            expect(function () {
                kontainer.registerValue('name', 'value');
            }).not.toThrow();
        });
    });

    describe('register', function () {
        it('should throw given non string name', function () {
            expect(function () {
                kontainer.register(false);
            }).toThrowError(/name/i);
        });

        it('should accept any value', function () {
            expect(function () {
                kontainer.register('name', /regexp/);
                kontainer.register('name', []);
                kontainer.register('name', 12345);
            }).not.toThrow();
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
            element.setAttribute('data-bind', 'component: { name: \'fake-component\', params: \'params\' }');
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

        it('should inject componentInfo', function () {
            var actualElement;

            registerComponent(['componentInfo', function (componentInfo) {
                actualElement = componentInfo.element;
            }]);

            ko.applyBindings(null, element);
            jasmine.clock().tick(1);
            expect(actualElement).toBe(element);
        });

        it('should inject params', function () {
            var actualParams;

            registerComponent(['params', function (params) {
                actualParams = params;
            }]);

            ko.applyBindings(null, element);
            jasmine.clock().tick(1);
            expect(actualParams).toBe('params');
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

    describe('mock', function () {
        describe('inject', function () {
            it('should throw injecting unknown dependency', function () {
                expect(function () {
                    kontainer.mock.inject(['unknown', function () {
                        return {};
                    }]);
                }).toThrowError(/unknown/i);
            });

            it('should inject registered value', function () {
                var factory = jasmine.createSpy('factory');

                kontainer.mock.registerValue('known', 'value');
                kontainer.mock.inject(['known', factory]);

                expect(factory).toHaveBeenCalledWith('value');
            });

            it('should inject registered factory', function () {
                var factory = jasmine.createSpy('factory'),
                    product = {};

                kontainer.mock.register('service', [function () {
                    return product;
                }]);
                kontainer.mock.inject(['service', factory]);

                expect(factory).toHaveBeenCalledWith(product);
            });

            it('should return product of factory', function () {
                var product = {},
                    actual;

                actual = kontainer.mock.inject([function () {
                    return product;
                }]);

                expect(actual).toBe(product);
            });
        });
    });
});
