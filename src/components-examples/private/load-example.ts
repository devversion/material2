import {Injector, Type, ɵNgModuleFactory} from '@angular/core';
import {EXAMPLE_COMPONENTS} from '../example-module';

/**
 * Asynchronously loads the specified example and returns its component and
 * an injector instantiated from the containing example module.
 *
 * This is used in the `dev-app` and `e2e-app` and assumes ESBuild having created
 * entry-points for the example modules under the `<host>/bundles/` URL.
 */
export async function loadExample(name: string, injector: Injector)
    : Promise<{component: Type<any>, injector: Injector}> {
  const {componentName, module} = EXAMPLE_COMPONENTS[name];
  const moduleExports = await import(
      `/bundles/components-examples/${module.importSpecifier}/index.js`);
  const moduleType: Type<any> = moduleExports[module.name];
  const componentType: Type<any> = moduleExports[componentName];
  // The components examples package is built with Ivy. This means that no factory files are
  // generated. To retrieve the factory of the AOT compiled module, we simply pass the module
  // class symbol to Ivy's module factory constructor. There is no public API for this yet.
  const moduleFactory = new ɵNgModuleFactory(moduleType);

  return {
    component: componentType,
    injector: moduleFactory.create(injector).injector,
  };
}
